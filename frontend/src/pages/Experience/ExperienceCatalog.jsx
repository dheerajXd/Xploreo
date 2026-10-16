import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/foundation';
import { useAsyncData } from '@/hooks/useAsyncData.js';
import { deleteExperience, listMyExperiences } from '@/services/partners.api.js';
import { compareSlots, formatCurrency, todayIso } from '@/lib/datetime.js';
import ExperiencePage from '@/components/experience/ExperiencePage.jsx';
import ModalFrame, { CloseButton } from '@/components/experience/ModalFrame.jsx';
import { ErrorNotice, LoadingBlock } from '@/components/experience/Feedback.jsx';
import ExperienceFormModal from '@/components/experience/ExperienceFormModal.jsx';
import SlotManager from '@/components/experience/SlotManager.jsx';
import './experienceShared.css';

function nextSession(exp, today) {
  const sorted = [...exp.slots].sort(compareSlots);
  const next = sorted.find((s) => s.available && s.date >= today) ?? sorted.find((s) => s.date >= today);
  if (next) return { slot: next, text: `Next session: ${next.date} at ${next.time} • ${next.booked}/${next.capacity} seats booked` };
  return { slot: null, text: sorted.length === 0 ? 'No slots created yet' : 'No upcoming sessions' };
}

export default function ExperienceCatalog() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { region } = useAuth();
  const { data, error, loading, reload, mutate } = useAsyncData(listMyExperiences);
  const [form, setForm] = useState(null); // { experience? }
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  const experiences = data ?? [];
  const manageId = params.get('manage');
  const today = todayIso();
  const managed = manageId ? experiences.find((e) => e.id === manageId) : null;

  const replace = (updated) => mutate((list) => list.map((e) => (e.id === updated.id ? updated : e)));

  function saved(experience, mode) {
    mutate((list) => (mode === 'add' ? [...list, experience] : list.map((e) => (e.id === experience.id ? experience : e))));
    setForm(null);
  }

  async function confirmRemove() {
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await deleteExperience(removing.id);
      mutate((list) => list.filter((e) => e.id !== removing.id));
      setRemoving(null);
    } catch (err) {
      setRemoveError(err);
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <ExperiencePage pageClass="experience-catalog-page" title="Experiences">
      {managed ? (
        <SlotManager key={managed.id} experience={managed} onUpdated={replace} />
      ) : (
        <div className="gd-page-wrapper">
          <main className="gd-page">
            <header className="gd-header" id="catalogHeader">
              <div className="gd-header-text">
                <span className="gd-eyebrow">Experience Portal</span>
                <h1 className="gd-title">Experiences</h1>
                <p className="gd-subtitle">
                  Assigned Region: <span className="gd-header-badge">{region}</span> · Manage your experience offerings
                </p>
              </div>
              <button className="gd-btn gd-btn-primary" id="openAddExperienceBtn" type="button" onClick={() => setForm({})}>
                + Add Experience
              </button>
            </header>

            {!data && loading ? <LoadingBlock label="Loading your catalog…" /> : null}
            {!data && error ? <ErrorNotice error={error} onRetry={reload} /> : null}
            {data ? <ErrorNotice error={error} onRetry={reload} /> : null}
            {manageId && data && !managed ? (
              <ErrorNotice error={{ status: 404, message: 'That experience is not in your catalog.' }} />
            ) : null}

            {data && experiences.length === 0 ? (
              <div className="gd-empty">
                <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.3rem' }}>No experiences right now</strong>
                You haven&apos;t added any experiences yet.
              </div>
            ) : null}

            <section id="experienceList" className="ep-catalog-stack">
              {experiences.map((exp) => {
                const next = nextSession(exp, today);
                return (
                  <article key={exp.id} className="ep-catalog-card" aria-label={exp.title}>
                    {exp.image ? (
                      <img src={exp.image} className="ep-catalog-img" alt={exp.title} />
                    ) : (
                      <div className="ep-catalog-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
                        No Image
                      </div>
                    )}
                    <div className="ep-catalog-body">
                      <div className="ep-catalog-head">
                        <h2>{exp.title}</h2>
                        <span className="gd-chip" style={exp.status === 'active' ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' } : { background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>
                          {exp.status}
                        </span>
                      </div>
                      <div className="ep-catalog-details">
                        <div className="ep-catalog-detail"><label>Price per person</label><span>{formatCurrency(exp.price)}</span></div>
                        <div className="ep-catalog-detail"><label>Duration</label><span>◷ {exp.durationHours} hours</span></div>
                        <div className="ep-catalog-detail">
                          <label>Capacity per session</label>
                          <span>◌ {next.slot ? `${next.slot.capacity} guests` : exp.capacity ? `${exp.capacity} guests` : 'Set in slots'}</span>
                        </div>
                      </div>
                      <div className="ep-catalog-next">{next.text}</div>
                      <div className="ep-catalog-actions">
                        <button className="gd-btn gd-btn-primary gd-btn-sm" type="button" onClick={() => navigate(`/experience/catalog?manage=${encodeURIComponent(exp.id)}`)}>Manage Slots</button>
                        <button className="gd-btn gd-btn-secondary gd-btn-sm" type="button" onClick={() => setForm({ experience: exp })}>Edit</button>
                        <button className="gd-btn gd-btn-danger gd-btn-sm" type="button" onClick={() => { setRemoveError(null); setRemoving(exp); }}>Delete</button>
                        <button className="gd-btn gd-btn-secondary gd-btn-sm" type="button" onClick={() => navigate(`/experience/bookings?experience=${encodeURIComponent(exp.id)}`)}>View Bookings</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </main>
        </div>
      )}

      {form ? (
        <ExperienceFormModal key={form.experience?.id ?? 'new'} experience={form.experience} onClose={() => setForm(null)} onSaved={saved} />
      ) : null}

      {removing ? (
        <ModalFrame id="deleteExperienceModal" labelledBy="deleteExperienceTitle" onClose={removeBusy ? undefined : () => setRemoving(null)}>
          <div className="modal-header">
            <h2 id="deleteExperienceTitle">Delete this experience?</h2>
            <CloseButton label="Close" onClick={removeBusy ? undefined : () => setRemoving(null)} />
          </div>
          <p>
            <strong>{removing.title}</strong> and all of its sessions will be removed. Guests with upcoming bookings will no longer see it. This cannot be undone.
          </p>
          <ErrorNotice error={removeError} />
          <div className="experience-form">
            <div className="modal-actions">
              <button type="button" onClick={() => setRemoving(null)} disabled={removeBusy}>Cancel</button>
              <button type="button" className="primary-btn" onClick={confirmRemove} disabled={removeBusy}>
                {removeBusy ? 'Deleting…' : 'Delete Experience'}
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </ExperiencePage>
  );
}
