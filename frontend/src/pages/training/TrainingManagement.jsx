import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken, getAuthUser } from '../../utils/auth.js'
import { Upload, TrendingUp, Trash2, Users } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function TrainingManagementPage() {
  const authUser = getAuthUser()
  const role = authUser?.role || 'employee'
  const canManageTraining = role === 'admin' || role === 'hr'
  const canAssignTraining = role === 'admin' || role === 'hr' || role === 'manager'

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [programs, setPrograms] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [reports, setReports] = useState(null)
  const [activeTab, setActiveTab] = useState('programs')
  const [showCreateProgram, setShowCreateProgram] = useState(false)
  const [showAssignTraining, setShowAssignTraining] = useState(false)
  const [uploadingModuleIndex, setUploadingModuleIndex] = useState(null)
  const [editingProgramId, setEditingProgramId] = useState('')

  const [formProgram, setFormProgram] = useState({
    name: '',
    description: '',
    category: 'mandatory',
    is_mandatory: true,
    passing_score: 70,
    modules: [
      { title: '', content: '', video_url: '', video_public_id: '', video_duration_seconds: null },
    ],
    quiz_questions: [{ question: '', options: ['', '', '', ''], correct_option_index: 0, marks: 1 }],
  })

  const getEmptyProgramForm = () => ({
    name: '',
    description: '',
    category: 'mandatory',
    is_mandatory: true,
    passing_score: 70,
    modules: [{ title: '', content: '', video_url: '', video_public_id: '', video_duration_seconds: null }],
    quiz_questions: [{ question: '', options: ['', '', '', ''], correct_option_index: 0, marks: 1 }],
  })

  const [formAssign, setFormAssign] = useState({
    employee_id: '',
    training_program_id: '',
    due_date: '',
  })

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    }),
    []
  )

  const addModuleRow = () => {
    setFormProgram((current) => ({
      ...current,
      modules: [
        ...current.modules,
        { title: '', content: '', video_url: '', video_public_id: '', video_duration_seconds: null },
      ],
    }))
  }

  const updateModuleRow = (index, patch) => {
    setFormProgram((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIndex) => (moduleIndex === index ? { ...module, ...patch } : module)),
    }))
  }

  const removeModuleRow = (index) => {
    setFormProgram((current) => ({
      ...current,
      modules: current.modules.length > 1 ? current.modules.filter((_, moduleIndex) => moduleIndex !== index) : current.modules,
    }))
  }

  const uploadModuleVideo = async (index, file) => {
    if (!file) return

    try {
      setErrorMessage('')
      setUploadingModuleIndex(index)

      const formData = new FormData()
      formData.append('video', file)
      formData.append('module_title', formProgram.modules[index]?.title || `module_${index + 1}`)
      formData.append('training_program_name', formProgram.name || 'training_program')

      const response = await fetch(`${API_BASE_URL}/api/training/modules/upload-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to upload training video.')

      updateModuleRow(index, {
        video_url: payload.data?.video_url || '',
        video_public_id: payload.data?.video_public_id || '',
        video_duration_seconds: payload.data?.video_duration_seconds || null,
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setUploadingModuleIndex(null)
    }
  }

  const startCreateProgram = () => {
    setEditingProgramId('')
    setFormProgram(getEmptyProgramForm())
    setShowCreateProgram(true)
  }

  const startEditProgram = (program) => {
    const modules = (program.modules || []).map((module) => ({
      title: module?.title || '',
      content: module?.content || '',
      video_url: module?.video_url || '',
      video_public_id: module?.video_public_id || '',
      video_duration_seconds: module?.video_duration_seconds ?? null,
    }))

    const quizQuestions = (program.quiz_questions || []).map((question) => {
      const options = Array.isArray(question?.options) ? question.options.slice(0, 4) : []
      while (options.length < 4) options.push('')

      return {
        question: question?.question || '',
        options,
        correct_option_index: Number.isInteger(Number(question?.correct_option_index)) ? Number(question.correct_option_index) : 0,
        marks: Number(question?.marks || 1),
      }
    })

    setEditingProgramId(program.id)
    setFormProgram({
      name: program.name || '',
      description: program.description || '',
      category: program.category || 'mandatory',
      is_mandatory: Boolean(program.is_mandatory),
      passing_score: Number(program.passing_score || 70),
      modules: modules.length ? modules : [{ title: '', content: '', video_url: '', video_public_id: '', video_duration_seconds: null }],
      quiz_questions: quizQuestions.length ? quizQuestions : [{ question: '', options: ['', '', '', ''], correct_option_index: 0, marks: 1 }],
    })
    setShowCreateProgram(true)
  }

  const cancelProgramEditor = () => {
    setShowCreateProgram(false)
    setEditingProgramId('')
    setFormProgram(getEmptyProgramForm())
  }

  const addQuizQuestionRow = () => {
    setFormProgram((current) => ({
      ...current,
      quiz_questions: [...current.quiz_questions, { question: '', options: ['', '', '', ''], correct_option_index: 0, marks: 1 }],
    }))
  }

  const updateQuizQuestionRow = (index, patch) => {
    setFormProgram((current) => ({
      ...current,
      quiz_questions: current.quiz_questions.map((question, questionIndex) => (questionIndex === index ? { ...question, ...patch } : question)),
    }))
  }

  const updateQuizQuestionOption = (questionIndex, optionIndex, value) => {
    const existing = formProgram.quiz_questions[questionIndex]
    const nextOptions = [...(existing?.options || ['', '', '', ''])]
    nextOptions[optionIndex] = value
    updateQuizQuestionRow(questionIndex, { options: nextOptions })
  }

  const removeQuizQuestionRow = (index) => {
    setFormProgram((current) => ({
      ...current,
      quiz_questions: current.quiz_questions.length > 1 ? current.quiz_questions.filter((_, questionIndex) => questionIndex !== index) : current.quiz_questions,
    }))
  }

  const fetchPrograms = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/programs`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch programs.')
    setPrograms(payload.data || [])
  }

  const fetchEmployees = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/assignees`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch employees.')
    setEmployees(payload.data || [])
  }

  const fetchAssignments = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/company-assignments`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch assignments.')
    setAssignments({
      pending: payload.data?.pending || [],
      completed: payload.data?.completed || [],
    })
  }

  const fetchReports = async () => {
    const response = await fetch(`${API_BASE_URL}/api/training/reports`, { headers: authHeaders })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Failed to fetch reports.')
    setReports(payload.data || null)
  }

  const reload = async () => {
    await Promise.all([fetchPrograms(), fetchEmployees(), fetchAssignments(), fetchReports()])
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

  const handleCreateOrUpdateProgram = async (e) => {
    e.preventDefault()
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const modules = formProgram.modules
        .map((module, index) => ({ ...module, order_index: index + 1 }))
        .filter((module) => String(module.title || '').trim() && String(module.content || '').trim())
      const quiz_questions = formProgram.quiz_questions
        .map((question, index) => ({
          question: String(question.question || '').trim(),
          options: (Array.isArray(question.options) ? question.options : []).map((option) => String(option || '').trim()),
          correct_option_index: Number(question.correct_option_index),
          marks: Number(question.marks || 1),
          order_index: index + 1,
        }))
        .filter((question) => question.question)

      if (!modules.length) {
        throw new Error('Add at least one training module.')
      }

      if (modules.some((module) => !module.video_url)) {
        throw new Error('Upload a Cloudinary video for every module.')
      }

      if (!quiz_questions.length) {
        throw new Error('Add at least one quiz question.')
      }

      if (quiz_questions.some((question) => question.options.length !== 4 || question.options.some((option) => !option))) {
        throw new Error('Each question must have exactly 4 options.')
      }

      if (quiz_questions.some((question) => !Number.isInteger(question.correct_option_index) || question.correct_option_index < 0 || question.correct_option_index > 3)) {
        throw new Error('Each question must have one correct answer selected.')
      }

      const isEditing = Boolean(editingProgramId)
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/api/training/programs/${editingProgramId}` : `${API_BASE_URL}/api/training/programs`,
        {
        method: isEditing ? 'PATCH' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...formProgram,
          modules,
          quiz_questions,
        }),
      }
      )

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || (isEditing ? 'Failed to update program.' : 'Failed to create program.'))

      setSuccessMessage(isEditing ? 'Training program updated successfully.' : 'Training program created successfully.')
      setFormProgram(getEmptyProgramForm())
      setEditingProgramId('')
      setShowCreateProgram(false)
      await fetchPrograms()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleAssignTraining = async (e) => {
    e.preventDefault()
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const response = await fetch(`${API_BASE_URL}/api/training/assignments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formAssign),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.message || 'Failed to assign training.')

      setSuccessMessage('Training assigned successfully.')
      setFormAssign({ employee_id: '', training_program_id: '', due_date: '' })
      setShowAssignTraining(false)
      await fetchAssignments()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <DashboardLayout role={role} title="Training Management" subtitle="Manage training programs and track completion.">
      <div className="space-y-6">
        {loading ? <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">Loading training management...</div> : null}
        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
        {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

        <section className="rounded-2xl border border-black/10 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('programs')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'programs' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Programs ({programs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'assignments' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Assignments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={[
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === 'reports' ? 'bg-black text-white' : 'text-black/65 hover:bg-black/5 hover:text-black',
              ].join(' ')}
            >
              Reports
            </button>
          </div>
        </section>

        {activeTab === 'programs' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Training Programs</h3>
                <p className="mt-1 text-sm text-black/60">Create and manage training programs for your organization.</p>
              </div>
              {canManageTraining ? (
                <button
                  onClick={() => (showCreateProgram ? cancelProgramEditor() : startCreateProgram())}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
                >
                  {showCreateProgram ? 'Cancel' : 'Create Program'}
                </button>
              ) : null}
            </div>

            {showCreateProgram && canManageTraining ? (
              <form onSubmit={handleCreateOrUpdateProgram} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Program Name</label>
                    <input
                      type="text"
                      value={formProgram.name}
                      onChange={(e) => setFormProgram({ ...formProgram, name: e.target.value })}
                      placeholder="e.g., Safety Induction, Leadership Training"
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Description</label>
                    <textarea
                      value={formProgram.description}
                      onChange={(e) => setFormProgram({ ...formProgram, description: e.target.value })}
                      placeholder="Brief description of the training program"
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Program Modules</label>
                      <button
                        type="button"
                        onClick={addModuleRow}
                        className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/5"
                      >
                        Add Module
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formProgram.modules.map((module, moduleIndex) => (
                        <div key={`module-${moduleIndex}`} className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/50">Module {moduleIndex + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeModuleRow(moduleIndex)}
                              className="rounded-md p-1 text-black/45 hover:bg-black/10 hover:text-black"
                              disabled={formProgram.modules.length === 1}
                              title="Remove Module"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              type="text"
                              value={module.title}
                              onChange={(e) => updateModuleRow(moduleIndex, { title: e.target.value })}
                              placeholder="Module title"
                              className="rounded-xl border border-black/15 px-3 py-2 text-sm"
                              required
                            />
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45">Upload Video</label>
                              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black/65 hover:bg-black/5">
                                <Upload className="size-4" />
                                {uploadingModuleIndex === moduleIndex ? 'Uploading...' : module.video_url ? 'Replace Video' : 'Upload Video'}
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={(e) => uploadModuleVideo(moduleIndex, e.target.files?.[0])}
                                />
                              </label>
                              {module.video_url ? (
                                <p className="mt-1 text-[11px] text-emerald-700">Video uploaded successfully.</p>
                              ) : (
                                <p className="mt-1 text-[11px] text-black/45">Video is required for each module.</p>
                              )}
                            </div>
                            <textarea
                              value={module.content}
                              onChange={(e) => updateModuleRow(moduleIndex, { content: e.target.value })}
                              placeholder="Module description / learning content"
                              className="rounded-xl border border-black/15 px-3 py-2 text-sm md:col-span-2"
                              rows={3}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Final Quiz</label>
                      <button
                        type="button"
                        onClick={addQuizQuestionRow}
                        className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/5"
                      >
                        Add Question
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formProgram.quiz_questions.map((question, questionIndex) => (
                        <div key={`quiz-question-${questionIndex}`} className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/50">Question {questionIndex + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeQuizQuestionRow(questionIndex)}
                              className="rounded-md p-1 text-black/45 hover:bg-black/10 hover:text-black"
                              disabled={formProgram.quiz_questions.length === 1}
                              title="Remove Question"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuizQuestionRow(questionIndex, { question: e.target.value })}
                              placeholder="Question"
                              className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                              required
                            />

                            <div className="grid gap-2 md:grid-cols-2">
                              {[0, 1, 2, 3].map((optionIndex) => (
                                <input
                                  key={`option-${questionIndex}-${optionIndex}`}
                                  type="text"
                                  value={question.options?.[optionIndex] || ''}
                                  onChange={(e) => updateQuizQuestionOption(questionIndex, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="rounded-xl border border-black/15 px-3 py-2 text-sm"
                                  required
                                />
                              ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45">Correct Answer</label>
                                <select
                                  value={question.correct_option_index}
                                  onChange={(e) => updateQuizQuestionRow(questionIndex, { correct_option_index: Number(e.target.value) })}
                                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                                >
                                  <option value={0}>Option 1</option>
                                  <option value={1}>Option 2</option>
                                  <option value={2}>Option 3</option>
                                  <option value={3}>Option 4</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45">Marks</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={question.marks ?? 1}
                                  onChange={(e) => updateQuizQuestionRow(questionIndex, { marks: e.target.value })}
                                  className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Passing Score</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formProgram.passing_score}
                      onChange={(e) => setFormProgram({ ...formProgram, passing_score: e.target.value })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Category</label>
                    <select
                      value={formProgram.category}
                      onChange={(e) => setFormProgram({ ...formProgram, category: e.target.value })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    >
                      <option value="mandatory">Mandatory</option>
                      <option value="skill-development">Skill Development</option>
                      <option value="optional">Optional</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Make Mandatory</label>
                    <select
                      value={formProgram.is_mandatory ? 'yes' : 'no'}
                      onChange={(e) => setFormProgram({ ...formProgram, is_mandatory: e.target.value === 'yes' })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">
                        {editingProgramId ? 'Update Program' : 'Create Program'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelProgramEditor}
                        className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold text-black hover:bg-black/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : null}

            <div className="grid gap-4">
              {programs.length ? (
                programs.map((program) => (
                  <div key={program.id} className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-black">{program.name}</h4>
                        <p className="mt-1 text-sm text-black/60">{program.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70">
                            {program.category.replace('-', ' ').toUpperCase()}
                          </span>
                          {program.is_mandatory && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">MANDATORY</span>}
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {program.modules?.length || 0} modules
                          </span>
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            {program.quiz_questions?.length || 0} quiz questions
                          </span>
                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70">
                            Passing {program.passing_score || 70}%
                          </span>
                        </div>
                      </div>
                      {canManageTraining ? (
                        <button
                          type="button"
                          onClick={() => startEditProgram(program)}
                          className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/5"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-black/10 bg-[#fafafa] p-6 text-center">
                  <p className="text-sm text-black/50">No training programs created yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'assignments' ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">Training Assignments</h3>
                <p className="mt-1 text-sm text-black/60">Assign training programs to employees and track completion.</p>
              </div>
              {canAssignTraining ? (
                <button
                  onClick={() => setShowAssignTraining(!showAssignTraining)}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
                >
                  {showAssignTraining ? 'Cancel' : 'Assign Training'}
                </button>
              ) : null}
            </div>

            {showAssignTraining && canAssignTraining ? (
              <form onSubmit={handleAssignTraining} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Assignee</label>
                    <select
                      value={formAssign.employee_id}
                      onChange={(e) => setFormAssign({ ...formAssign, employee_id: e.target.value })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {`${emp.first_name || ''} ${emp.last_name || ''}`.trim()} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Training Program</label>
                    <select
                      value={formAssign.training_program_id}
                      onChange={(e) => setFormAssign({ ...formAssign, training_program_id: e.target.value })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select program</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={formAssign.due_date}
                      onChange={(e) => setFormAssign({ ...formAssign, due_date: e.target.value })}
                      className="w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button type="submit" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">
                      Assign Training
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-black">Pending</h4>
                <p className="mt-1 text-xs text-black/50">{assignments.pending?.length || 0} employees</p>
                <div className="mt-3 space-y-2">
                  {assignments.pending?.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-lg border border-black/10 bg-[#fafafa] p-2 text-xs">
                      <p className="font-medium text-black">{a.employees?.first_name || 'Unknown'}</p>
                      <p className="text-black/60">{a.training_programs?.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-emerald-700">Completed</h4>
                <p className="mt-1 text-xs text-black/50">{assignments.completed?.length || 0} employees</p>
                <div className="mt-3 space-y-2">
                  {assignments.completed?.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs">
                      <p className="font-medium text-black">{a.employees?.first_name || 'Unknown'}</p>
                      <p className="text-black/60">{a.training_programs?.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'reports' ? (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-black">Training Reports</h3>
              <p className="mt-1 text-sm text-black/60">Overview of training completion across your organization.</p>
            </div>

            {reports ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Total Assignments</p>
                    <p className="mt-2 text-2xl font-bold text-black">{reports.summary?.total_assignments || 0}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Completed</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{reports.summary?.completed || 0}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Pending</p>
                    <p className="mt-2 text-2xl font-bold text-amber-700">{reports.summary?.pending || 0}</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Completion Rate</p>
                    <p className="mt-2 text-2xl font-bold text-black">{reports.summary?.completion_rate || 0}%</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <h4 className="text-sm font-semibold text-black">By Training Program</h4>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-black/10 text-sm">
                      <thead className="bg-[#f8f8fa] text-left text-black/70">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Program</th>
                          <th className="px-3 py-2 font-semibold">Total</th>
                          <th className="px-3 py-2 font-semibold">Completed</th>
                          <th className="px-3 py-2 font-semibold">Completion %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {reports.by_program ? (
                          reports.by_program.map((prog) => (
                            <tr key={prog.program_id}>
                              <td className="px-3 py-2">{prog.program_name}</td>
                              <td className="px-3 py-2">{prog.total}</td>
                              <td className="px-3 py-2 font-semibold text-emerald-700">{prog.completed}</td>
                              <td className="px-3 py-2">{prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0}%</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-center text-black/50">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-6 text-center">
                <TrendingUp className="mx-auto size-8 text-black/30" />
                <p className="mt-3 text-sm text-black/50">No training data available yet.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default TrainingManagementPage
