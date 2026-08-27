"""
PDF Report Generator using ReportLab.
Generates a professional security audit PDF for vaccination reports.
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# Brand color palette
PRUSSIAN_BLUE = colors.HexColor("#012652")
DODGER_BLUE = colors.HexColor("#0D94FB")
BRAND_BLUE = colors.HexColor("#2563EB")
DARK_BG = colors.HexColor("#0F1A2E")
CRITICAL_RED = colors.HexColor("#DC2626")
HIGH_ORANGE = colors.HexColor("#EA580C")
MEDIUM_YELLOW = colors.HexColor("#CA8A04")
LOW_GREEN = colors.HexColor("#16A34A")
TEXT_DARK = colors.HexColor("#1E293B")
TEXT_MUTED = colors.HexColor("#64748B")
BORDER_LIGHT = colors.HexColor("#E2E8F0")
WHITE = colors.white


SEVERITY_COLORS = {
    "CRITICAL": CRITICAL_RED,
    "HIGH": HIGH_ORANGE,
    "MEDIUM": MEDIUM_YELLOW,
    "LOW": LOW_GREEN,
}


def generate_vaccination_pdf(report_data: dict, merchant_name: str) -> bytes:
    """Generate a styled PDF vaccination report and return bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # --- HEADER ---
    header_data = [[
        Paragraph(
            f"<font color='#{PRUSSIAN_BLUE.hexval()[2:]}' size='18'><b>Merchant's Adversarial Shadow</b></font><br/>"
            f"<font color='#{TEXT_MUTED.hexval()[2:]}' size='10'>Vaccination Security Report — Confidential</font>",
            ParagraphStyle("header", fontName="Helvetica", leading=22)
        ),
        Paragraph(
            f"<font size='9' color='#{TEXT_MUTED.hexval()[2:]}'>"
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')}<br/>"
            f"Report ID: {report_data.get('scan_id', 'N/A')[:16].upper()}<br/>"
            f"Merchant: <b>{merchant_name}</b></font>",
            ParagraphStyle("header_right", fontName="Helvetica", alignment=TA_RIGHT, leading=14)
        ),
    ]]
    header_table = Table(header_data, colWidths=[120 * mm, 60 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PRUSSIAN_BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8 * mm))

    # --- EXECUTIVE SUMMARY ---
    summary = report_data.get("summary", {})
    story.append(Paragraph(
        "<b>Executive Summary</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    risk_color = SEVERITY_COLORS.get(summary.get("risk_rating", "HIGH"), CRITICAL_RED)
    exec_summary_data = [
        ["Overall Security Score", "Risk Rating", "Critical", "High", "Medium", "Total Exposure"],
        [
            Paragraph(f"<font size='20' color='#{risk_color.hexval()[2:]}'><b>{summary.get('overall_score', 0)}/100</b></font>",
                      ParagraphStyle("score", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='14' color='#{risk_color.hexval()[2:]}'><b>{summary.get('risk_rating', 'HIGH')}</b></font>",
                      ParagraphStyle("risk", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{CRITICAL_RED.hexval()[2:]}'><b>{summary.get('critical', 0)}</b></font>",
                      ParagraphStyle("crit", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{HIGH_ORANGE.hexval()[2:]}'><b>{summary.get('high', 0)}</b></font>",
                      ParagraphStyle("high", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='16' color='#{MEDIUM_YELLOW.hexval()[2:]}'><b>{summary.get('medium', 0)}</b></font>",
                      ParagraphStyle("med", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='12'><b>Rs. {summary.get('total_exposure_inr', 0):,.0f}</b></font>",
                      ParagraphStyle("exp", fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ],
    ]
    exec_table = Table(exec_summary_data, colWidths=[35 * mm, 28 * mm, 20 * mm, 20 * mm, 20 * mm, 37 * mm])
    exec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRUSSIAN_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), WHITE]),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 8 * mm))

    # --- VULNERABILITY DETAILS ---
    story.append(Paragraph(
        "<b>Vulnerability Details</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    vuln_header = ["ID", "Vulnerability", "Severity", "CVSS", "Exposure (Rs.)", "Confirmed"]
    vuln_rows = [vuln_header]
    for vuln in report_data.get("vulnerabilities", []):
        sev = vuln.get("severity", "MEDIUM")
        sev_color = SEVERITY_COLORS.get(sev, MEDIUM_YELLOW)
        row = [
            Paragraph(f"<font size='7'><b>{vuln['id']}</b></font>",
                      ParagraphStyle("id", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='8'><b>{vuln['name']}</b></font>",
                      ParagraphStyle("name", fontName="Helvetica-Bold")),
            Paragraph(f"<font size='8' color='#{sev_color.hexval()[2:]}'><b>{sev}</b></font>",
                      ParagraphStyle("sev", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='9'><b>{vuln.get('cvss_score', 0)}</b></font>",
                      ParagraphStyle("cvss", fontName="Helvetica-Bold", alignment=TA_CENTER)),
            Paragraph(f"<font size='8'>Rs. {vuln.get('financial_exposure_inr', 0):,}</font>",
                      ParagraphStyle("exp", alignment=TA_RIGHT)),
            Paragraph(f"<font size='8' color='{'#16A34A' if vuln.get('confirmed') else '#94A3B8'}'>{'YES' if vuln.get('confirmed') else 'LOW RISK'}</font>",
                      ParagraphStyle("conf", fontName="Helvetica-Bold", alignment=TA_CENTER)),
        ]
        vuln_rows.append(row)

    vuln_table = Table(vuln_rows, colWidths=[28 * mm, 55 * mm, 22 * mm, 14 * mm, 24 * mm, 17 * mm])
    vuln_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRUSSIAN_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), WHITE]),
    ]))
    story.append(vuln_table)
    story.append(Spacer(1, 8 * mm))

    # --- REMEDIATION SECTION ---
    story.append(Paragraph(
        "<b>Remediation Roadmap</b>",
        ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13, textColor=PRUSSIAN_BLUE, spaceAfter=4)
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 4 * mm))

    for vuln in sorted(report_data.get("vulnerabilities", []), key=lambda x: x.get("cvss_score", 0), reverse=True):
        if not vuln.get("confirmed"):
            continue
        sev_color = SEVERITY_COLORS.get(vuln.get("severity", "MEDIUM"), MEDIUM_YELLOW)
        rem_data = [
            [
                Paragraph(f"<font color='#{sev_color.hexval()[2:]}' size='9'><b>[{vuln['severity']}] {vuln['id']}</b></font>",
                          ParagraphStyle("rem_id", fontName="Helvetica-Bold")),
                Paragraph(f"<font size='8' color='#{TEXT_MUTED.hexval()[2:]}'>Effort: {vuln.get('remediation_effort', 'N/A')}</font>",
                          ParagraphStyle("rem_effort", alignment=TA_RIGHT)),
            ],
            [
                Paragraph(f"<font size='8'>{vuln.get('remediation', '')}</font>",
                          ParagraphStyle("rem_text", fontName="Helvetica", leading=12)),
                "",
            ],
        ]
        rem_table = Table(rem_data, colWidths=[130 * mm, 30 * mm])
        rem_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("SPAN", (0, 1), (1, 1)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(KeepTogether([rem_table, Spacer(1, 3 * mm)]))

    # --- FOOTER ---
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"<font size='8' color='#{TEXT_MUTED.hexval()[2:]}'>This report is generated by Merchant's Adversarial Shadow — "
        f"an autonomous defense system for agentic commerce. "
        f"Results are based on simulated adversarial testing and should be reviewed by a qualified security engineer before production deployment.</font>",
        ParagraphStyle("footer", fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()
