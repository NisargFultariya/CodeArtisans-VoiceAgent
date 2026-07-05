from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

import db

router = APIRouter(prefix="/admin", tags=["admin"])

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{clinic_name} — Booking Admin</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Inter', sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 2rem;
  }}
  .header {{
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }}
  .dot {{
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse 2s infinite;
  }}
  @keyframes pulse {{
    0%,100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }}
  }}
  h1 {{ font-size: 1.5rem; font-weight: 700; color: #f8fafc; }}
  .subtitle {{ font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }}
  .stats {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }}
  .stat-card {{
    background: #1e2433;
    border: 1px solid #2d3748;
    border-radius: 12px;
    padding: 1.25rem;
  }}
  .stat-label {{ font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }}
  .stat-value {{ font-size: 2rem; font-weight: 700; color: #6366f1; margin-top: 0.25rem; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    background: #1e2433;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #2d3748;
  }}
  thead {{ background: #161b2e; }}
  th {{
    padding: 0.875rem 1.25rem;
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    font-weight: 600;
  }}
  td {{
    padding: 0.875rem 1.25rem;
    border-top: 1px solid #2d3748;
    font-size: 0.875rem;
    color: #cbd5e1;
  }}
  tr:hover td {{ background: #232a3e; }}
  .badge {{
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }}
  .badge-full {{ background: #450a0a; color: #f87171; }}
  .badge-partial {{ background: #1c1917; color: #fb923c; }}
  .badge-open {{ background: #052e16; color: #4ade80; }}
  .patients {{ color: #94a3b8; font-size: 0.8rem; }}
  .empty {{ text-align: center; padding: 3rem; color: #475569; }}
  .refresh {{ margin-top: 1.5rem; text-align: right; }}
  .refresh a {{
    color: #6366f1;
    text-decoration: none;
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    border: 1px solid #4f46e5;
    border-radius: 8px;
    transition: background 0.2s;
  }}
  .refresh a:hover {{ background: #4f46e5; color: white; }}
</style>
</head>
<body>
<div class="header">
  <div class="dot"></div>
  <div>
    <h1>{clinic_name} — Bookings Dashboard</h1>
    <div class="subtitle">Live view of confirmed appointments</div>
  </div>
</div>

<div class="stats">
  <div class="stat-card">
    <div class="stat-label">Total Bookings</div>
    <div class="stat-value">{total_bookings}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Slots with Bookings</div>
    <div class="stat-value">{filled_slots}</div>
  </div>
</div>

{table_html}

<div class="refresh"><a href="/admin/bookings">↺ Refresh</a></div>
</body>
</html>"""


def _capacity_badge(booked: int, capacity: int) -> str:
    if booked >= capacity:
        return f'<span class="badge badge-full">FULL {booked}/{capacity}</span>'
    elif booked > 0:
        return f'<span class="badge badge-partial">{booked}/{capacity}</span>'
    return f'<span class="badge badge-open">{booked}/{capacity}</span>'


@router.get("/bookings", response_class=HTMLResponse)
async def admin_bookings_html():
    """Admin HTML view of all confirmed bookings per slot."""
    from fastapi import Request
    rows = await db.get_bookings_summary()
    all_bookings = await db.get_all_bookings()

    total_bookings = len(all_bookings)
    filled_slots = len(rows)

    if not rows:
        table_html = '<div class="empty">No confirmed bookings yet.</div>'
    else:
        table_rows = ""
        for r in rows:
            badge = _capacity_badge(r["total_bookings"], r["capacity"])
            patients_html = f'<div class="patients">{r.get("patients","")}</div>'
            table_rows += f"""<tr>
  <td>{r['date']}</td>
  <td>{r['time']}</td>
  <td>{badge}</td>
  <td>{patients_html}</td>
</tr>"""
        table_html = f"""
<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Time Slot</th>
      <th>Capacity</th>
      <th>Patients</th>
    </tr>
  </thead>
  <tbody>{table_rows}</tbody>
</table>"""

    clinic_name = "Sunrise Clinic"
    return _HTML_TEMPLATE.format(
        clinic_name=clinic_name,
        total_bookings=total_bookings,
        filled_slots=filled_slots,
        table_html=table_html,
    )


@router.get("/bookings.json")
async def admin_bookings_json():
    """Admin JSON endpoint for programmatic access."""
    summary = await db.get_bookings_summary()
    all_bookings = await db.get_all_bookings()
    return {
        "summary": summary,
        "bookings": all_bookings,
        "total": len(all_bookings),
    }


@router.get("/holds.json")
async def admin_holds_json():
    """Return all holds (active, expired, confirmed, released) — useful for webhook debugging."""
    all_holds = await db.get_all_holds()
    return {
        "holds": all_holds,
        "total": len(all_holds),
    }
