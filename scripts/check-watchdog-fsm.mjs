#!/usr/bin/env node
import assert from 'node:assert/strict';
import { ACTIONS, STATES, describeTransitions, evaluatePostRestart, evaluateTick, initialState } from '../core/watchdogStateMachine.js';

const now = 1_000_000;
const base = {
  nowMs: now,
  watchdogActive: true,
  hasListener: true,
  restarting: false,
  watchGroupsEnabledCount: 3,
  quietHoursActive: false,
  listenerLikelyDown: false,
  lastWatchedMessageAt: now - 60_000,
  lastAlertAt: 0,
  silenceThresholdMs: 300_000,
  alertCooldownMs: 300_000,
};

assert.equal(initialState(), STATES.INACTIVE);
assert.ok(describeTransitions().some((t) => t.from === STATES.MONITORING && t.to === STATES.RECOVERY_PENDING));
assert.deepEqual(evaluateTick({ ...base, watchdogActive: false }).state, STATES.INACTIVE);
assert.deepEqual(evaluateTick({ ...base, hasListener: false }).reason, 'api/listener missing');
assert.equal(evaluateTick({ ...base, restarting: true }).state, STATES.RESTARTING);
assert.equal(evaluateTick({ ...base, watchGroupsEnabledCount: 0 }).state, STATES.IDLE_NO_WATCH_GROUPS);
assert.equal(evaluateTick({ ...base, quietHoursActive: true }).state, STATES.QUIET_HOURS);
assert.equal(evaluateTick({ ...base, quietHoursActive: true, listenerLikelyDown: true }).state, STATES.LISTENER_DOWN_WAITING);
assert.equal(evaluateTick(base).state, STATES.MONITORING);
assert.equal(evaluateTick({ ...base, listenerLikelyDown: true }).state, STATES.LISTENER_DOWN_WAITING);
assert.deepEqual(evaluateTick({ ...base, lastWatchedMessageAt: now - 301_000 }), {
  state: STATES.RECOVERY_PENDING,
  action: ACTIONS.RESTART_LISTENER,
  reason: 'silence above threshold and cooldown elapsed; recovery should run',
  silentMs: 301_000,
  sinceLastAlertMs: null,
});
assert.equal(evaluateTick({ ...base, lastWatchedMessageAt: now - 301_000, lastAlertAt: now - 10_000 }).state, STATES.COOLDOWN);
assert.deepEqual(evaluatePostRestart({ consecutiveFailures: 2, maxConsecutiveFailures: 3 }), {
  state: STATES.RECOVERY_FAILED,
  action: ACTIONS.NONE,
  reason: 'restart failed (2/3)',
});
assert.deepEqual(evaluatePostRestart({ consecutiveFailures: 3, maxConsecutiveFailures: 3 }), {
  state: STATES.CRITICAL_ESCALATE,
  action: ACTIONS.ESCALATE_PROCESS,
  reason: 'consecutive failures 3 >= max 3',
});

console.log('watchdog FSM checks PASS');
