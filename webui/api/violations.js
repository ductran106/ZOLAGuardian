// webui/api/violations.js

import { Router } from "express";
import db from "../../core/db.js";

export const violationsRouter = Router();

violationsRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT v.id,
              v.user_id,
              v.display_name,
              v.group_id,
              v.type,
              v.detail,
              v.ts,
              COALESCE(NULLIF(TRIM(wg.name), ''),
                       NULLIF(TRIM(gn.name), ''),
                       v.group_id) AS group_label
       FROM violations v
       LEFT JOIN watch_groups wg ON wg.group_id = v.group_id
       LEFT JOIN group_names gn ON gn.group_id = v.group_id
       ORDER BY v.id DESC
       LIMIT 400`
    )
    .all();
  res.json({ ok: true, items: rows });
});
