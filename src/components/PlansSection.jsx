import React, { useEffect, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToPlans, createPlan, deletePlan } from '../services/planService'
import PlanCard from './PlanCard'
import PlanDetail from './PlanDetail'
import NewPlanModal from './NewPlanModal'
import { friendlyFirestoreError } from '../utils/errors'

const PLAN_COLORS = ['#7C3AED', '#059669', '#DC2626', '#D97706', '#2563EB']

const PlansSection = () => {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToPlans(user.uid, (data) => {
      setPlans(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!actionError) return
    const t = setTimeout(() => setActionError(''), 4000)
    return () => clearTimeout(t)
  }, [actionError])

  const handleCreatePlan = async (data) => {
    const color = PLAN_COLORS[plans.length % PLAN_COLORS.length]
    await createPlan(user.uid, { ...data, color })
  }

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan and all its tasks? This cannot be undone.')) return
    setActionError('')
    try {
      await deletePlan(user.uid, planId)
      if (selectedPlanId === planId) setSelectedPlanId(null)
    } catch (err) {
      console.error(err)
      setActionError(friendlyFirestoreError(err))
    }
  }

  // If a plan is selected, show its detail view instead of the list.
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  if (selectedPlan) {
    return <PlanDetail plan={selectedPlan} onBack={() => setSelectedPlanId(null)} />
  }

  return (
    <div className="flex-1 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deadline-driven plans, broken into tasks.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> New plan
        </button>
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No plans yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Create your first plan — give it a name, a deadline, and start adding tasks.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90"
          >
            Create a plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={setSelectedPlanId}
              onDelete={handleDeletePlan}
            />
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground hover:border-ring/50 hover:text-foreground hover:bg-muted/40 transition-all min-h-[180px]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Create a new plan</span>
          </button>
        </div>
      )}

      {showModal && (
        <NewPlanModal onClose={() => setShowModal(false)} onCreate={handleCreatePlan} />
      )}
    </div>
  )
}

export default PlansSection