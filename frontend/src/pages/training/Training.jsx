import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'
import { CheckCircle, Clock, Download, Eye, PlayCircle, RotateCcw, ShieldCheck } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

const getAssignmentProgressStorageKey = (assignmentId) => `training-progress-${assignmentId}`

const readAssignmentProgress = (assignmentId) => {
  try {
    const saved = localStorage.getItem(getAssignmentProgressStorageKey(assignmentId))
    const parsed = saved ? JSON.parse(saved) : null
    return Array.isArray(parsed?.watched_module_indexes) ? parsed.watched_module_indexes : []
  } catch {
    return []
  }
}

const writeAssignmentProgress = (assignmentId, watchedModuleIndexes) => {
  localStorage.setItem(
    getAssignmentProgressStorageKey(assignmentId),
    JSON.stringify({ watched_module_indexes: watchedModuleIndexes })
  )
}

const clearAssignmentProgress = (assignmentId) => {
  localStorage.removeItem(getAssignmentProgressStorageKey(assignmentId))
}

const sortByOrderIndex = (rows) => {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => Number(a?.order_index || 0) - Number(b?.order_index || 0))
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
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [watchedModuleIndexes, setWatchedModuleIndexes] = useState([])
  const [quizAnswers, setQuizAnswers] = useState([])
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [quizResultMessage, setQuizResultMessage] = useState('')
  const [quizReview, setQuizReview] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)

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

  const openTrainingProgram = (assignment) => {
    const quizQuestions = sortByOrderIndex(assignment?.training_programs?.quiz_questions || [])
    setSelectedAssignment(assignment)
    setWatchedModuleIndexes(readAssignmentProgress(assignment.id))
    setQuizAnswers(new Array(quizQuestions.length).fill(null))
    setQuizResultMessage('')
    setErrorMessage('')
    setSuccessMessage('')
  }

  const closeProgramViewer = () => {
    setSelectedAssignment(null)
    setWatchedModuleIndexes([])
    setQuizAnswers([])
    setQuizResultMessage('')
    setQuizReview(null)
  }

  const retryQuiz = () => {
    const questions = sortByOrderIndex(selectedAssignment?.training_programs?.quiz_questions || [])
    setQuizAnswers(new Array(questions.length).fill(null))
    setQuizResultMessage('')
    setQuizReview(null)
  }

  const toggleModuleWatched = (moduleIndex) => {
    if (!selectedAssignment) return

    const next = watchedModuleIndexes.includes(moduleIndex)
      ? watchedModuleIndexes.filter((index) => index !== moduleIndex)
      : [...watchedModuleIndexes, moduleIndex]

    setWatchedModuleIndexes(next)
    writeAssignmentProgress(selectedAssignment.id, next)
  }

  const handleQuizAnswerChange = (questionIndex, optionIndex) => {
    setQuizAnswers((current) => {
      const next = [...current]
      next[questionIndex] = optionIndex
      return next
    })
  }

  const handleSubmitQuiz = async () => {
    if (!selectedAssignment) return

    try {
      setErrorMessage('')
      setSuccessMessage('')
      setQuizResultMessage('')
      setSubmittingQuiz(true)

      const modules = sortByOrderIndex(selectedAssignment?.training_programs?.modules || [])
      const questions = sortByOrderIndex(selectedAssignment?.training_programs?.quiz_questions || [])

      if (watchedModuleIndexes.length < modules.length) {
        throw new Error('Please complete all modules before attempting the quiz.')
      }

      if (!questions.length) {
        throw new Error('No quiz available for this training program.')
      }

      if (quizAnswers.some((answer) => answer === null || answer === undefined)) {
        throw new Error('Please answer all quiz questions before submitting.')
      }

      const response = await fetch(`${API_BASE_URL}/api/training/assignments/${selectedAssignment.id}/complete`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ answers: quizAnswers }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to submit quiz.')

      const score = payload?.data?.quiz?.score ?? 0
      const passingScore = payload?.data?.quiz?.passing_score ?? 70
      const passed = Boolean(payload?.data?.quiz?.passed)
      const responseDetails = payload?.data?.quiz?.response_details || []
      const quizQuestions = payload?.data?.quiz?.questions || []

      if (passed) {
        setSuccessMessage(`Quiz passed (${score}% / ${passingScore}%). Certificate issued.`)
        clearAssignmentProgress(selectedAssignment.id)
        setQuizReview({ score, passingScore, passed: true, responseDetails, questions: quizQuestions })
        setSelectedAssignment(null)
        setWatchedModuleIndexes([])
        setQuizAnswers([])
        setQuizResultMessage('')
      } else {
        setQuizResultMessage(`Quiz submitted. You scored ${score}% (required ${passingScore}%). Review the correct answers below and retry.`)
        setQuizReview({ score, passingScore, passed: false, responseDetails, questions: quizQuestions })
      }

      await reload()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const selectedModules = sortByOrderIndex(selectedAssignment?.training_programs?.modules || [])
  const selectedQuizQuestions = sortByOrderIndex(selectedAssignment?.training_programs?.quiz_questions || [])
  const modulesProgressPercent = selectedModules.length ? Math.round((watchedModuleIndexes.length / selectedModules.length) * 100) : 0
  const allModulesCompleted = selectedModules.length > 0 && watchedModuleIndexes.length === selectedModules.length

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
              <p className="mt-1 text-sm text-black/60">Open a training program, complete modules, then submit the final quiz.</p>
            </div>

            {selectedAssignment ? (
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-black">{selectedAssignment.training_programs?.name}</h4>
                    <p className="mt-1 text-sm text-black/60">{selectedAssignment.training_programs?.description}</p>
                    <p className="mt-2 text-xs font-medium text-black/55">
                      Progress: {watchedModuleIndexes.length}/{selectedModules.length} modules completed ({modulesProgressPercent}%)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeProgramViewer}
                    className="rounded-xl border border-black/15 px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                  >
                    Close Program
                  </button>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${modulesProgressPercent}%` }} />
                </div>

                <div className="mt-5 space-y-4">
                  <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-black/55">Modules</h5>
                  {selectedModules.length ? (
                    selectedModules.map((module, moduleIndex) => {
                      const watched = watchedModuleIndexes.includes(moduleIndex)
                      return (
                        <div key={`module-${selectedAssignment.id}-${moduleIndex}`} className="rounded-xl border border-black/10 bg-[#fafafa] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-black">Module {moduleIndex + 1}: {module.title}</p>
                              <p className="mt-1 text-sm text-black/65">{module.content}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleModuleWatched(moduleIndex)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${watched ? 'bg-emerald-100 text-emerald-700' : 'border border-black/20 text-black/70 hover:bg-black/5'}`}
                            >
                              {watched ? 'Completed' : 'Mark Complete'}
                            </button>
                          </div>

                          {module.video_url ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-black/95">
                              <video src={module.video_url} controls className="h-auto w-full" preload="metadata" />
                            </div>
                          ) : (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                              Video is not available for this module yet.
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      No modules found for this training.
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold uppercase tracking-[0.16em] text-black/55">Final Quiz</h5>
                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70">
                      Passing {selectedAssignment.training_programs?.passing_score || 70}%
                    </span>
                  </div>

                  {!allModulesCompleted ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Complete all module videos to unlock the quiz.
                    </div>
                  ) : null}

                  {allModulesCompleted ? (
                    selectedQuizQuestions.length ? (
                      <div className="space-y-4">
                        {selectedQuizQuestions.map((question, questionIndex) => (
                          <div key={`quiz-${selectedAssignment.id}-${questionIndex}`} className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                            <p className="text-sm font-semibold text-black">Q{questionIndex + 1}. {question.question}</p>
                            <div className="mt-2 space-y-2">
                              {(Array.isArray(question.options) ? question.options : []).map((option, optionIndex) => (
                                <label key={`quiz-option-${selectedAssignment.id}-${questionIndex}-${optionIndex}`} className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-black/80">
                                  <input
                                    type="radio"
                                    name={`quiz-question-${selectedAssignment.id}-${questionIndex}`}
                                    checked={quizAnswers[questionIndex] === optionIndex}
                                    onChange={() => handleQuizAnswerChange(questionIndex, optionIndex)}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        {quizResultMessage ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{quizResultMessage}</div>
                        ) : null}

                        {quizReview?.passed === false && Array.isArray(quizReview.responseDetails) ? (
                          <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-black">
                              <ShieldCheck className="size-4 text-amber-600" />
                              Quiz Review
                            </div>
                            <div className="space-y-3">
                              {quizReview.responseDetails.map((detail, index) => (
                                <div key={`review-${selectedAssignment.id}-${index}`} className={`rounded-lg border p-3 text-sm ${detail.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                                  <p className="font-semibold text-black">Q{index + 1}. {detail.question_text}</p>
                                  <p className="mt-1 text-black/70">Your answer: {detail.selected_option_text || 'Not answered'}</p>
                                  {!detail.is_correct ? (
                                    <p className="mt-1 text-rose-700">Correct answer: {detail.correct_option_text}</p>
                                  ) : (
                                    <p className="mt-1 text-emerald-700">Correct answer selected.</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={submittingQuiz}
                            onClick={handleSubmitQuiz}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingQuiz ? 'Submitting...' : 'Submit Final Quiz'}
                          </button>
                          {quizReview?.passed === false ? (
                            <button
                              type="button"
                              onClick={retryQuiz}
                              className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold text-black hover:bg-black/5"
                            >
                              <RotateCcw className="size-4" />
                              Retry Quiz
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        Quiz is not configured for this training yet.
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            ) : null}

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
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {(training.training_programs?.modules || []).length} modules
                          </span>
                          {training.due_date && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue(training.due_date) ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              Due: {formatDate(training.due_date)} {isOverdue(training.due_date) ? '(Overdue)' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openTrainingProgram(training)}
                        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
                      >
                        <PlayCircle className="size-4" />
                        Open Training
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
              <p className="mt-1 text-sm text-black/60">View and download your completed training certificates.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3">
                {certificates.length ? (
                  certificates.map((cert) => (
                    <div key={cert.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">Certificate</p>
                          <h4 className="mt-1 text-lg font-semibold text-black">{cert.training_programs?.name}</h4>
                          <p className="mt-1 text-sm text-black/60">Issued on {formatDate(cert.issued_date)}</p>
                          <p className="mt-1 text-xs text-black/45">Certificate No: {cert.certificate_number}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCertificate(cert)}
                            className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-3 py-2 text-sm font-semibold text-black hover:bg-black/5"
                          >
                            <Eye className="size-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCertificate(cert)
                              downloadCertificateSvg({
                                certificate: cert,
                                employeeName: `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || authUser?.email || 'Employee',
                              })
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
                          >
                            <Download className="size-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-6 text-center">
                    <ShieldCheck className="mx-auto size-8 text-black/30" />
                    <p className="mt-3 text-sm text-black/50">No certificates yet. Complete training to earn certificates.</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937] p-5 text-white shadow-xl">
                {selectedCertificate ? (
                  <CertificatePreview
                    certificate={selectedCertificate}
                    employeeName={`${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || authUser?.email || 'Employee'}
                    onDownload={() => downloadCertificateSvg({
                      certificate: selectedCertificate,
                      employeeName: `${authUser?.first_name || ''} ${authUser?.last_name || ''}`.trim() || authUser?.email || 'Employee',
                    })}
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
                    <ShieldCheck className="size-10 text-amber-300" />
                    <p className="mt-4 text-lg font-semibold">Select a certificate to preview</p>
                    <p className="mt-2 text-sm text-white/70">Your certificate will appear here in a printable, shareable format.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

const buildCertificateSvg = ({ certificate, employeeName }) => {
  const programName = certificate?.training_programs?.name || 'Training Program'
  const certificateNumber = certificate?.certificate_number || '-'
  const issueDate = formatDate(certificate?.issued_date)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="1000" viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffdf7" />
      <stop offset="50%" stop-color="#fff8e1" />
      <stop offset="100%" stop-color="#f6efe0" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7d774" />
      <stop offset="50%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#b8860b" />
    </linearGradient>
  </defs>
  <rect width="1400" height="1000" rx="36" fill="url(#bg)"/>
  <rect x="34" y="34" width="1332" height="932" rx="28" fill="none" stroke="url(#gold)" stroke-width="10"/>
  <rect x="70" y="70" width="1260" height="860" rx="22" fill="none" stroke="#e9d8a6" stroke-width="2" stroke-dasharray="10 10"/>

  <circle cx="175" cy="150" r="62" fill="#111827"/>
  <text x="175" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#f8fafc" font-weight="700">HRIMS</text>
  <text x="175" y="192" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#fde68a" letter-spacing="3">ORBIT</text>

  <text x="700" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#111827" font-weight="700">Certificate of Completion</text>
  <text x="700" y="228" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">This certificate is proudly presented to</text>
  <text x="700" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="74" fill="#111827" font-weight="700">${escapeXml(employeeName)}</text>

  <line x1="250" y1="380" x2="1150" y2="380" stroke="url(#gold)" stroke-width="4"/>
  <text x="700" y="465" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#374151">for successfully completing</text>
  <text x="700" y="545" text-anchor="middle" font-family="Georgia, serif" font-size="56" fill="#111827" font-weight="700">${escapeXml(programName)}</text>
  <text x="700" y="605" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#4b5563">with a passing score in the final assessment</text>

  <circle cx="222" cy="760" r="72" fill="none" stroke="url(#gold)" stroke-width="8"/>
  <circle cx="222" cy="760" r="52" fill="#f8fafc" stroke="#d4af37" stroke-width="2"/>
  <text x="222" y="755" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#111827" font-weight="700">Certified</text>
  <text x="222" y="782" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6b7280" letter-spacing="2">LEARNER</text>

  <text x="1180" y="730" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">Certificate No.</text>
  <text x="1180" y="765" text-anchor="middle" font-family="Courier New, monospace" font-size="20" fill="#111827">${escapeXml(certificateNumber)}</text>
  <text x="1180" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">Issued</text>
  <text x="1180" y="855" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#111827">${escapeXml(issueDate)}</text>

  <text x="700" y="885" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">HRIMS Orbit Learning Academy</text>
</svg>`
}

const escapeXml = (value) => {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const downloadCertificateSvg = ({ certificate, employeeName }) => {
  const svg = buildCertificateSvg({ certificate, employeeName })
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(certificate?.training_programs?.name || 'certificate').replace(/[^a-zA-Z0-9_-]+/g, '_')}.svg`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function CertificatePreview({ certificate, employeeName, onDownload }) {
  const programName = certificate?.training_programs?.name || 'Training Program'
  const certificateNumber = certificate?.certificate_number || '-'
  const issueDate = formatDate(certificate?.issued_date)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">Certificate Preview</p>
          <h4 className="mt-1 text-xl font-semibold">{programName}</h4>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          <Download className="size-4" />
          Download
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-[#fffdf5] via-[#fff7e3] to-[#f3e6c8] p-6 text-slate-950 shadow-2xl">
        <div className="rounded-[24px] border border-amber-500/35 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">HRIMS Orbit</p>
              <h5 className="mt-2 text-3xl font-semibold">Certificate of Completion</h5>
            </div>
            <div className="rounded-full border-4 border-amber-500 bg-white px-4 py-3 text-center shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Verified</p>
              <p className="text-sm font-semibold text-slate-800">Achievement</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">This certificate is proudly presented to</p>
            <p className="mt-4 text-5xl font-semibold text-slate-950">{employeeName}</p>
            <p className="mt-6 text-base text-slate-700">for successfully completing</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{programName}</p>
            <p className="mt-6 text-sm text-slate-700">with a passing score in the final quiz assessment</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/75 p-4 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate No.</p>
              <p className="mt-2 break-all font-mono text-sm text-slate-900">{certificateNumber}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 text-center shadow-sm md:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Issued</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{issueDate}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 text-center shadow-sm md:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Platform</p>
              <p className="mt-2 text-sm font-medium text-slate-900">HRIMS Orbit Learning Academy</p>
            </div>
          </div>

          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <div className="h-px w-56 bg-slate-900/20" />
              <p className="mt-2 text-xs text-slate-600">Authorized Signature</p>
            </div>
            <div className="text-right">
              <div className="mx-auto h-24 w-24 rounded-full border-[10px] border-amber-500/70 bg-amber-100 shadow-inner" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Seal</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/60">The download button exports a printable SVG certificate that can be saved or printed as PDF.</p>
    </div>
  )
}

export default TrainingPage
