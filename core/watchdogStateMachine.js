// core/watchdogStateMachine.js
// Pure watchdog FSM: tách quyết-định (state/transition) khỏi side-effect (restart, alert).
// Không import db / config / fs / network — chỉ làm việc trên input thuần.

export const STATES = Object.freeze({
  INACTIVE: "INACTIVE",
  IDLE_NO_WATCH_GROUPS: "IDLE_NO_WATCH_GROUPS",
  RESTARTING: "RESTARTING",
  QUIET_HOURS: "QUIET_HOURS",
  MONITORING: "MONITORING",
  LISTENER_DOWN_WAITING: "LISTENER_DOWN_WAITING",
  COOLDOWN: "COOLDOWN",
  RECOVERY_PENDING: "RECOVERY_PENDING",
  RECOVERY_FAILED: "RECOVERY_FAILED",
  CRITICAL_ESCALATE: "CRITICAL_ESCALATE",
});

export const ACTIONS = Object.freeze({
  NONE: "NONE",
  RESTART_LISTENER: "RESTART_LISTENER",
  ESCALATE_PROCESS: "ESCALATE_PROCESS",
});

export const EVENTS = Object.freeze({
  START: "START",
  TICK: "TICK",
  MESSAGE_WATCHED: "MESSAGE_WATCHED",
  LISTENER_EVENT_DOWN: "LISTENER_EVENT_DOWN",
  RESTART_BEGIN: "RESTART_BEGIN",
  RESTART_SUCCESS: "RESTART_SUCCESS",
  RESTART_FAILURE: "RESTART_FAILURE",
  ESCALATE: "ESCALATE",
  CLEAR: "CLEAR",
});

export function initialState() {
  return STATES.INACTIVE;
}

/**
 * Bảng chuyển trạng thái danh nghĩa (documentation / inspection only).
 * Tick-driven FSM re-derives state mỗi tick qua evaluateTick(); bảng này
 * dùng để Cu Đệ + Phase-3 audit-trail có thể đọc transitions hợp lệ.
 */
export function describeTransitions() {
  const T = STATES;
  const E = EVENTS;
  return [
    { from: T.INACTIVE, event: E.START, to: T.MONITORING },
    { from: T.MONITORING, event: E.MESSAGE_WATCHED, to: T.MONITORING },
    { from: T.MONITORING, event: E.LISTENER_EVENT_DOWN, to: T.LISTENER_DOWN_WAITING },
    { from: T.MONITORING, event: E.TICK, to: T.MONITORING },
    { from: T.MONITORING, event: E.TICK, to: T.QUIET_HOURS },
    { from: T.MONITORING, event: E.TICK, to: T.COOLDOWN },
    { from: T.MONITORING, event: E.TICK, to: T.RECOVERY_PENDING },
    { from: T.MONITORING, event: E.TICK, to: T.IDLE_NO_WATCH_GROUPS },
    { from: T.LISTENER_DOWN_WAITING, event: E.MESSAGE_WATCHED, to: T.MONITORING },
    { from: T.LISTENER_DOWN_WAITING, event: E.TICK, to: T.RECOVERY_PENDING },
    { from: T.QUIET_HOURS, event: E.TICK, to: T.MONITORING },
    { from: T.QUIET_HOURS, event: E.LISTENER_EVENT_DOWN, to: T.LISTENER_DOWN_WAITING },
    { from: T.COOLDOWN, event: E.TICK, to: T.RECOVERY_PENDING },
    { from: T.COOLDOWN, event: E.MESSAGE_WATCHED, to: T.MONITORING },
    { from: T.RECOVERY_PENDING, event: E.RESTART_BEGIN, to: T.RESTARTING },
    { from: T.RESTARTING, event: E.RESTART_SUCCESS, to: T.MONITORING },
    { from: T.RESTARTING, event: E.RESTART_FAILURE, to: T.RECOVERY_FAILED },
    { from: T.RESTARTING, event: E.RESTART_FAILURE, to: T.CRITICAL_ESCALATE },
    { from: T.RECOVERY_FAILED, event: E.TICK, to: T.RECOVERY_PENDING },
    { from: T.RECOVERY_FAILED, event: E.MESSAGE_WATCHED, to: T.MONITORING },
    { from: T.CRITICAL_ESCALATE, event: E.ESCALATE, to: T.INACTIVE },
    { from: "*", event: E.CLEAR, to: T.INACTIVE },
  ];
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value) {
  return !!value;
}

/**
 * Pure tick evaluator.
 * Mirror trực tiếp logic chuỗi early-return trong startWatchdog tick hiện tại,
 * nhưng trả về (state, action, reason) tường minh để dễ kiểm thử / audit.
 *
 * @param {{
 *   nowMs:number,
 *   watchdogActive:boolean,
 *   hasListener:boolean,
 *   restarting:boolean,
 *   watchGroupsEnabledCount:number,
 *   quietHoursActive:boolean,
 *   listenerLikelyDown:boolean,
 *   lastWatchedMessageAt:number,
 *   lastAlertAt:number,
 *   silenceThresholdMs:number,
 *   alertCooldownMs:number,
 * }} input
 * @returns {{state:string, action:string, reason:string, silentMs:number, sinceLastAlertMs:number|null}}
 */
export function evaluateTick(input) {
  const nowMs = num(input?.nowMs);
  const watchdogActive = bool(input?.watchdogActive);
  const hasListener = bool(input?.hasListener);
  const restarting = bool(input?.restarting);
  const watchGroupsEnabledCount = Math.max(0, Math.floor(num(input?.watchGroupsEnabledCount)));
  const quietHoursActive = bool(input?.quietHoursActive);
  const listenerLikelyDown = bool(input?.listenerLikelyDown);
  const lastWatchedMessageAt = num(input?.lastWatchedMessageAt);
  const lastAlertAt = num(input?.lastAlertAt);
  const silenceThresholdMs = Math.max(0, num(input?.silenceThresholdMs));
  const alertCooldownMs = Math.max(0, num(input?.alertCooldownMs, silenceThresholdMs));

  const silentMs = lastWatchedMessageAt > 0 ? Math.max(0, nowMs - lastWatchedMessageAt) : 0;
  const sinceLastAlertMs = lastAlertAt > 0 ? Math.max(0, nowMs - lastAlertAt) : null;

  if (!watchdogActive) {
    return result(STATES.INACTIVE, ACTIONS.NONE, "watchdog timer not active", silentMs, sinceLastAlertMs);
  }
  if (!hasListener) {
    return result(STATES.INACTIVE, ACTIONS.NONE, "api/listener missing", silentMs, sinceLastAlertMs);
  }
  if (restarting) {
    return result(STATES.RESTARTING, ACTIONS.NONE, "restart already in progress", silentMs, sinceLastAlertMs);
  }
  if (watchGroupsEnabledCount <= 0) {
    return result(STATES.IDLE_NO_WATCH_GROUPS, ACTIONS.NONE, "no watch groups enabled", silentMs, sinceLastAlertMs);
  }
  if (quietHoursActive && !listenerLikelyDown) {
    return result(STATES.QUIET_HOURS, ACTIONS.NONE, "within quiet hours and listener appears healthy", silentMs, sinceLastAlertMs);
  }
  if (silentMs < silenceThresholdMs) {
    if (listenerLikelyDown) {
      return result(
        STATES.LISTENER_DOWN_WAITING,
        ACTIONS.NONE,
        "listener event flagged down; waiting for silence threshold before recovery",
        silentMs,
        sinceLastAlertMs
      );
    }
    return result(STATES.MONITORING, ACTIONS.NONE, "silence below threshold", silentMs, sinceLastAlertMs);
  }
  if (sinceLastAlertMs !== null && sinceLastAlertMs < alertCooldownMs) {
    return result(
      STATES.COOLDOWN,
      ACTIONS.NONE,
      "silence above threshold but alert cooldown active",
      silentMs,
      sinceLastAlertMs
    );
  }
  return result(
    STATES.RECOVERY_PENDING,
    ACTIONS.RESTART_LISTENER,
    "silence above threshold and cooldown elapsed; recovery should run",
    silentMs,
    sinceLastAlertMs
  );
}

/**
 * Pure post-restart-failure evaluator. Quyết định leo thang process-level restart.
 *
 * @param {{ consecutiveFailures:number, maxConsecutiveFailures:number }} input
 * @returns {{state:string, action:string, reason:string}}
 */
export function evaluatePostRestart(input) {
  const consecutiveFailures = Math.max(0, Math.floor(num(input?.consecutiveFailures)));
  const maxConsecutiveFailures = Math.max(1, Math.floor(num(input?.maxConsecutiveFailures, 3)));
  if (consecutiveFailures >= maxConsecutiveFailures) {
    return {
      state: STATES.CRITICAL_ESCALATE,
      action: ACTIONS.ESCALATE_PROCESS,
      reason: `consecutive failures ${consecutiveFailures} >= max ${maxConsecutiveFailures}`,
    };
  }
  return {
    state: STATES.RECOVERY_FAILED,
    action: ACTIONS.NONE,
    reason: `restart failed (${consecutiveFailures}/${maxConsecutiveFailures})`,
  };
}

function result(state, action, reason, silentMs, sinceLastAlertMs) {
  return { state, action, reason, silentMs, sinceLastAlertMs };
}
