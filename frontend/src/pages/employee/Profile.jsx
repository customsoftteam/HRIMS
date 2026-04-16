import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout.jsx'
import { API_BASE_URL } from '../../utils/api.js'
import { getAuthToken } from '../../utils/auth.js'

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
const EMPLOYEE_TYPE_OPTIONS = ['Permanent', 'Contract', 'Intern', 'Consultant', 'Trainee']

const EMPTY_FORM = {
  personal_details: {
    date_of_birth: '',
    gender: '',
    mobile_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
  },
  family_details: {
    father_name: '',
    mother_name: '',
    marital_status: '',
    spouse_name: '',
    dependents_count: '',
  },
  academic_details: {
    highest_qualification: '',
    institution_name: '',
    year_of_passing: '',
    specialization: '',
  },
  professional_details: {
    employee_type: '',
    joining_date: '',
    total_experience_years: '',
    previous_employer: '',
    skills: '',
  },
  health_details: {
    blood_group: '',
    allergies: '',
    chronic_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  },
}

const SECTION_TITLES = {
  personal_details: 'Personal Details',
  family_details: 'Family Details',
  academic_details: 'Academic Details',
  professional_details: 'Professional Details',
  health_details: 'Health Details',
}

function EmployeeProfilePage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [profileExists, setProfileExists] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [completion, setCompletion] = useState({
    percent: 0,
    is_complete: false,
    missing_sections: Object.keys(SECTION_TITLES),
    section_status: {},
  })
  const [employeeBasics, setEmployeeBasics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getAuthToken()}`,
    }),
    []
  )

  const isSingleMaritalStatus = (value) => String(value || '').trim().toLowerCase() === 'single'

  const hydrateFromPayload = (payload) => {
    const data = payload?.data || {}
    const profile = data.profile

    setEmployeeBasics(data.employee || null)
    setCompletion(
      data.completion || {
        percent: 0,
        is_complete: false,
        missing_sections: Object.keys(SECTION_TITLES),
        section_status: {},
      }
    )

    if (!profile) {
      setProfileExists(false)
      setIsEditing(true)
      setForm(EMPTY_FORM)
      return
    }

    setProfileExists(true)
    setIsEditing(false)
    setForm({
      personal_details: { ...EMPTY_FORM.personal_details, ...(profile.personal_details || {}) },
      family_details: { ...EMPTY_FORM.family_details, ...(profile.family_details || {}) },
      academic_details: { ...EMPTY_FORM.academic_details, ...(profile.academic_details || {}) },
      professional_details: { ...EMPTY_FORM.professional_details, ...(profile.professional_details || {}) },
      health_details: { ...EMPTY_FORM.health_details, ...(profile.health_details || {}) },
    })
  }

  const fetchProfile = async () => {
    const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
      headers: authHeaders,
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.message || 'Failed to fetch profile details.')
    }

    hydrateFromPayload(payload)
  }

  useEffect(() => {
    ;(async () => {
      try {
        await fetchProfile()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateField = (section, key) => (event) => {
    const value = event.target.value
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
        ...(section === 'family_details' && key === 'marital_status' && isSingleMaritalStatus(value)
          ? { spouse_name: '' }
          : {}),
      },
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const method = profileExists ? 'PUT' : 'POST'
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to save profile.')
      }

      hydrateFromPayload(payload)
      setSuccessMessage(profileExists ? 'Profile updated successfully.' : 'Profile created successfully.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!profileExists) return
    if (!window.confirm('Delete your entire profile details? This action cannot be undone.')) return

    setDeleting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'DELETE',
        headers: authHeaders,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to delete profile.')
      }

      setProfileExists(false)
      setIsEditing(true)
      setForm(EMPTY_FORM)
      setCompletion({
        percent: 0,
        is_complete: false,
        missing_sections: Object.keys(SECTION_TITLES),
        section_status: {},
      })
      setSuccessMessage('Profile deleted successfully. Please fill your details again.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="employee" title="Employee Dashboard" subtitle="Profile">
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/60">Loading profile...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="employee" title="Employee Dashboard" subtitle="Profile">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">My Profile</p>
            <h2 className="mt-3 text-2xl font-semibold text-black">Complete Employee Profile</h2>
            <p className="mt-2 max-w-2xl text-sm text-black/60">Fill personal, family, academic, professional, and health information. Your profile stays read-only after save until you click Edit Profile.</p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {profileExists ? (
              <button
                type="button"
                onClick={() => setIsEditing((value) => !value)}
                className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                {isEditing ? 'View Profile' : 'Edit Profile'}
              </button>
            ) : null}
            {isEditing && profileExists ? (
              <button
                type="button"
                onClick={() => {
                  if (profileExists) {
                    fetchProfile().catch((error) => setErrorMessage(error.message))
                  } else {
                    setForm(EMPTY_FORM)
                  }
                  setErrorMessage('')
                  setSuccessMessage('')
                  setIsEditing(false)
                }}
                className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        {!completion.is_complete ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Profile completion: {completion.percent}%</p>
            <p className="mt-1">Some sections are missing. Please fill: {(completion.missing_sections || []).map((key) => SECTION_TITLES[key] || key).join(', ') || 'required details'}.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Your profile is complete ({completion.percent}%).
          </div>
        )}

        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-black">Profile Overview</h3>
              <p className="mt-1 text-sm text-black/60">Review your saved information here. Switch to edit mode to change anything.</p>
            </div>
            <div className="rounded-full border border-black/10 bg-[#fafafa] px-3 py-1 text-xs font-semibold text-black/70">
              {completion.percent}% complete
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoCard label="Name" value={employeeBasics ? `${employeeBasics.first_name || ''} ${employeeBasics.last_name || ''}`.trim() : '-'} />
            <InfoCard label="Email" value={employeeBasics?.email || '-'} />
            <InfoCard label="Mobile" value={form.personal_details.mobile_number || '-'} />
            <InfoCard label="Marital Status" value={form.family_details.marital_status || '-'} />
            <InfoCard label="Blood Group" value={form.health_details.blood_group || '-'} />
            <InfoCard label="Joining Date" value={form.professional_details.joining_date || '-'} />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProfileSectionCard
            title="Personal Details"
            subtitle="Basic contact and address information."
          >
            {isEditing ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Date of birth" type="date" value={form.personal_details.date_of_birth || ''} onChange={updateField('personal_details', 'date_of_birth')} />
                <SelectField label="Gender" value={form.personal_details.gender || ''} onChange={updateField('personal_details', 'gender')} options={GENDER_OPTIONS} placeholder="Select gender" />
                <Field label="Mobile number" value={form.personal_details.mobile_number || ''} onChange={updateField('personal_details', 'mobile_number')} placeholder="Enter mobile number" />
                <Field label="Address line 1" value={form.personal_details.address_line_1 || ''} onChange={updateField('personal_details', 'address_line_1')} placeholder="House / street / apartment" />
                <Field label="Address line 2" value={form.personal_details.address_line_2 || ''} onChange={updateField('personal_details', 'address_line_2')} placeholder="Landmark / additional details" />
                <Field label="City" value={form.personal_details.city || ''} onChange={updateField('personal_details', 'city')} placeholder="City" />
                <Field label="State" value={form.personal_details.state || ''} onChange={updateField('personal_details', 'state')} placeholder="State" />
                <Field label="Country" value={form.personal_details.country || ''} onChange={updateField('personal_details', 'country')} placeholder="Country" />
              </div>
            ) : (
              <ReadOnlyGrid items={[
                ['Date of birth', form.personal_details.date_of_birth],
                ['Gender', form.personal_details.gender],
                ['Mobile number', form.personal_details.mobile_number],
                ['Address line 1', form.personal_details.address_line_1],
                ['Address line 2', form.personal_details.address_line_2],
                ['City', form.personal_details.city],
                ['State', form.personal_details.state],
                ['Country', form.personal_details.country],
              ]} />
            )}
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Family Details"
            subtitle="Family and dependents information."
          >
            {isEditing ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Father name" value={form.family_details.father_name || ''} onChange={updateField('family_details', 'father_name')} placeholder="Father name" />
                <Field label="Mother name" value={form.family_details.mother_name || ''} onChange={updateField('family_details', 'mother_name')} placeholder="Mother name" />
                <SelectField label="Marital status" value={form.family_details.marital_status || ''} onChange={updateField('family_details', 'marital_status')} options={MARITAL_STATUS_OPTIONS} placeholder="Select marital status" />
                <Field
                  label="Spouse name"
                  value={form.family_details.spouse_name || ''}
                  onChange={updateField('family_details', 'spouse_name')}
                  placeholder={isSingleMaritalStatus(form.family_details.marital_status) ? 'Not available for Single' : 'Spouse name'}
                  disabled={isSingleMaritalStatus(form.family_details.marital_status)}
                />
                <Field label="Dependents count" value={form.family_details.dependents_count || ''} onChange={updateField('family_details', 'dependents_count')} placeholder="0" />
              </div>
            ) : (
              <ReadOnlyGrid items={[
                ['Father name', form.family_details.father_name],
                ['Mother name', form.family_details.mother_name],
                ['Marital status', form.family_details.marital_status],
                ['Spouse name', isSingleMaritalStatus(form.family_details.marital_status) ? 'Not applicable' : form.family_details.spouse_name],
                ['Dependents count', form.family_details.dependents_count],
              ]} />
            )}
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Academic Details"
            subtitle="Education history and specialization."
          >
            {isEditing ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Highest qualification" value={form.academic_details.highest_qualification || ''} onChange={updateField('academic_details', 'highest_qualification')} placeholder="Highest qualification" />
                <Field label="Institution name" value={form.academic_details.institution_name || ''} onChange={updateField('academic_details', 'institution_name')} placeholder="Institution name" />
                <Field label="Year of passing" type="number" value={form.academic_details.year_of_passing || ''} onChange={updateField('academic_details', 'year_of_passing')} placeholder="YYYY" />
                <Field label="Specialization" value={form.academic_details.specialization || ''} onChange={updateField('academic_details', 'specialization')} placeholder="Specialization" />
              </div>
            ) : (
              <ReadOnlyGrid items={[
                ['Highest qualification', form.academic_details.highest_qualification],
                ['Institution name', form.academic_details.institution_name],
                ['Year of passing', form.academic_details.year_of_passing],
                ['Specialization', form.academic_details.specialization],
              ]} />
            )}
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Professional Details"
            subtitle="Employment type, experience, and work history."
          >
            {isEditing ? (
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Employee type" value={form.professional_details.employee_type || ''} onChange={updateField('professional_details', 'employee_type')} options={EMPLOYEE_TYPE_OPTIONS} placeholder="Select employee type" />
                <Field label="Joining date" type="date" value={form.professional_details.joining_date || ''} onChange={updateField('professional_details', 'joining_date')} />
                <Field label="Total experience (years)" type="number" value={form.professional_details.total_experience_years || ''} onChange={updateField('professional_details', 'total_experience_years')} placeholder="0" />
                <Field label="Previous employer" value={form.professional_details.previous_employer || ''} onChange={updateField('professional_details', 'previous_employer')} placeholder="Previous employer" />
                <Field label="Skills" value={form.professional_details.skills || ''} onChange={updateField('professional_details', 'skills')} placeholder="Skills, separated by commas" className="md:col-span-2" />
              </div>
            ) : (
              <ReadOnlyGrid items={[
                ['Employee type', form.professional_details.employee_type],
                ['Joining date', form.professional_details.joining_date],
                ['Total experience (years)', form.professional_details.total_experience_years],
                ['Previous employer', form.professional_details.previous_employer],
                ['Skills', form.professional_details.skills],
              ]} />
            )}
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Health Details"
            subtitle="Medical and emergency contact information."
          >
            {isEditing ? (
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Blood group" value={form.health_details.blood_group || ''} onChange={updateField('health_details', 'blood_group')} options={BLOOD_GROUP_OPTIONS} placeholder="Select blood group" />
                <Field label="Allergies" value={form.health_details.allergies || ''} onChange={updateField('health_details', 'allergies')} placeholder="Known allergies" />
                <Field label="Chronic conditions" value={form.health_details.chronic_conditions || ''} onChange={updateField('health_details', 'chronic_conditions')} placeholder="Chronic conditions" />
                <Field label="Emergency contact name" value={form.health_details.emergency_contact_name || ''} onChange={updateField('health_details', 'emergency_contact_name')} placeholder="Emergency contact name" />
                <Field label="Emergency contact phone" value={form.health_details.emergency_contact_phone || ''} onChange={updateField('health_details', 'emergency_contact_phone')} placeholder="Emergency contact phone" />
              </div>
            ) : (
              <ReadOnlyGrid items={[
                ['Blood group', form.health_details.blood_group],
                ['Allergies', form.health_details.allergies],
                ['Chronic conditions', form.health_details.chronic_conditions],
                ['Emergency contact name', form.health_details.emergency_contact_name],
                ['Emergency contact phone', form.health_details.emergency_contact_phone],
              ]} />
            )}
          </ProfileSectionCard>

          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
                {saving ? 'Saving...' : profileExists ? 'Update Profile' : 'Create Profile'}
              </button>
              <button type="button" disabled={deleting || !profileExists} onClick={handleDelete} className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          ) : null}
        </form>

        {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{errorMessage}</p> : null}
        {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
      </div>
    </DashboardLayout>
  )
}

function ProfileSectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          <p className="mt-1 text-sm text-black/60">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-1 text-sm text-black">{value || 'Not filled yet'}</p>
    </div>
  )
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-black/45">{label}</span>
      <input {...props} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-black/30 focus:border-black/25 focus:ring-2 focus:ring-black/5" />
    </label>
  )
}

function SelectField({ label, options, placeholder, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-black/45">{label}</span>
      <select {...props} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/25 focus:ring-2 focus:ring-black/5">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function ReadOnlyGrid({ items }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">{label}</p>
          <p className="mt-1 text-sm text-black">{value || 'Not filled yet'}</p>
        </div>
      ))}
    </div>
  )
}

export default EmployeeProfilePage
