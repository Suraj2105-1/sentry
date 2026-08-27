/**
 * VaccinationPanel — Main panel coordinating the vaccination scan UI.
 * Wraps scan controls, progress, and summary.
 */
import ScanProgress from './ScanProgress'

export default function VaccinationPanel({
  merchants,
  selectedMerchant,
  onSelectMerchant,
  onRunScan,
  onDownloadPdf,
  scanning,
  scanSteps,
  report,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Scan Progress Panel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scan Progress</span>
          {scanning && (
            <div className="status-pill">
              <span className="status-dot" />
              Scanning
            </div>
          )}
        </div>
        <ScanProgress steps={scanSteps} scanning={scanning} />
      </div>
    </div>
  )
}
