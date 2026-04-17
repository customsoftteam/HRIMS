import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'
import { CheckCircle, Clock } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function TrainingPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingTraining, setPendingTraining] = useState([])
  const [completedTraining, setCompletedTraining] = useState([])
  const [certificates, setCertificates] = useState([])
  const [activeTab, setActiveTab] = useState('pending')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const fetchMyTraining = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/my-assignments`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch training.')
    
    setPendingTraining(payload.data?.pending || [])
    setCompletedTraining(payload.data?.completed || [])
  }

  const fetchCertificates = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/certificates/${authUser.id}`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch certificates.')
    
    setCertificates(payload.data || [])
  }

  const reload = async () => {
    await Promise.all([fetchMyTraining(), fetchCertificates()])
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setErrorMessage('')
        await reload()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCompleteTraining = async (assignmentId) => {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/training/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: authHeaders,
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to complete training.')

      setSuccessMessage('Training completed successfully! Certificate issued.')
      await reload()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <DashboardLayout role={role} title="Training" subtitle="Complete your assigned training programs.">
      <div className="space-y-6">
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading training...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'pending' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Pending ({pendingTraining.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'completed' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Completed ({completedTraining.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificates')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'certificates' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Certificates ({certificates.length})
            </button>
          </div>
        </section>

        {activeTab === 'pending' ? (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-black">Pending Training</h3>
              <p className="mt-1 text-sm text-black/60">Training programs you need to complete.</p>
            </div>

            <div className="grid gap-4">
              {pendingTraining.length ? (
                pendingTraining.map((training) => (
                  <div key={training.id} className={`rounded-2xl border p-4 ${isOverdue(training.due_date) ? 'border-rose-200 bg-rose-50' : 'border-black/10 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-black">{training.training_programs?.name}</h4>
                        <p className="mt-1 text-sm text-black/60">{training.training_programs?.description}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {training.training_programs?.category && (
                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70">
                              {training.training_programs.category.replace('-', ' ').toUpperCase()}
                            </span>
                          )}
                          {training.due_date && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue(training.due_date) ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              Due: {formatDate(training.due_date)} {isOverdue(training.due_date) ? '(Overdue)' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCompleteTraining(training.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-black/10 bg-[#fafafa] p-6 text-center">
                  <Clock className="mx-auto size-8 text-black/30" />
                  <p className="mt-3 text-sm text-black/50">No pending training. Great job!</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'completed' ? (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-700">Completed Training</h3>
              <p className="mt-1 text-sm text-black/60">Training programs you have successfully completed.</p>
            </div>

            <div className="grid gap-4">
              {completedTraining.length ? (
                completedTraining.map((training) => (
                  <div key={training.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 size-5 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-black">{training.training_programs?.name}</h4>
                        <p className="mt-1 text-sm text-black/60">Completed on {formatDate(training.completed_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-black/10 bg-[#fafafa] p-6 text-center">
                  <CheckCircle className="mx-auto size-8 text-black/30" />
                  <p className="mt-3 text-sm text-black/50">No completed training yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'certificates' ? (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-black">Your Certificates</h3>
              <p className="mt-1 text-sm text-black/60">Digital certificates issued for completed training.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full divide-y divide-black/10 text-sm">
                <thead className="bg-[#f8f8fa] text-left text-black/70">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Training Program</th>
                    <th className="px-3 py-2 font-semibold">Issued Date</th>
                    <th className="px-3 py-2 font-semibold">Certificate #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {certificates.length ? (
                    certificates.map((cert) => (
                      <tr key={cert.id}>
                        <td className="px-3 py-2">{cert.training_programs?.name}</td>
                        <td className="px-3 py-2">{formatDate(cert.issued_date)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{cert.certificate_number}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-center text-black/50">
                        No certificates yet. Complete training to earn certificates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default TrainingPage
