import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

const BUDGET_RANGES =[
  "Under 5,000",
  "5,000-10,000",
  "10,000-20,000",
  "20,000-30,000",
  "30,000+"
]

const INITIAL = { name: '', email: '', budgetRange: '', message: '' };

function validate(fields) {
  const errs = {};
  if (!fields.name.trim()) errs.name = 'Name is required';
  else if (fields.name.trim().length < 2) errs.name = 'Must be at least 2 characters';
  if (!fields.email.trim()) errs.email = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(fields.email)) errs.email = 'Enter a valid email address';
  if (!fields.budgetRange) errs.budgetRange = 'Please select a budget range';
  if (!fields.message.trim()) errs.message = 'Message is required';
  else if (fields.message.trim().length < 10) errs.message = 'Must be at least 10 characters';
  return errs;
}

// ── Field: moved out of LandingPage so it isn't redefined (and remounted)
//    on every render, which was causing inputs to lose focus while typing.
function Field({ id, label, error, children, charCount }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          {label}
        </label>
        {charCount !== undefined && (
          <span className={`text-xs ${charCount > 1800 ? 'text-rose-400' : 'text-slate-600'}`}>
            {charCount} / 2000
          </span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-rose-400 font-medium animate-fade-in flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [form,    setForm]    = useState(INITIAL);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      const errs = validate({ ...form, [name]: value });
      setErrors((p) => ({ ...p, [name]: errs[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const errs = validate(form);
    setErrors((p) => ({ ...p, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await api.post('/leads', form);
      if (data.success) {
        setSuccess(true);
        setForm(INITIAL);
        setTouched({});
        setErrors({});
        toast.success(data.message);
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
        toast.error('Please correct the highlighted fields.');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] relative overflow-x-hidden">

      {/* ── Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] animate-[float_6s_ease-in-out_infinite_2s]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#080b14]/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">LeadDesk</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#features" className="hidden sm:block text-sm text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">Features</a>
            <a href="#contact"  className="hidden sm:block text-sm text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">Contact</a>
            <Link to="/admin/login"
              className="text-sm font-semibold bg-gradient-to-r from-brand-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-brand-500/30 hover:opacity-90 hover:-translate-y-px transition-all">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 flex flex-col items-center text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse-dot" />
          Now accepting new clients
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.05] mb-6 max-w-3xl">
          Turn Leads Into{' '}
          <span >Revenue</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-12">
          LeadDesk gives your team the power to capture, track, and convert every opportunity — before your competitors do.
        </p>
        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 glass-card px-8 py-5">
          {[['10k+','Leads Managed'],['98%','Response Rate'],['24h','Avg. Response']].map(([v,l],i,arr) => (
            <div key={l} className="flex items-center gap-5">
              <div className="text-center">
                <div className="text-2xl font-black ">{v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{l}</div>
              </div>
              {i < arr.length-1 && <div className="w-px h-8 bg-white/[0.06]" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 rounded-full">Why LeadDesk</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to close more deals</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '⚡', color: 'from-brand-500/20 to-brand-600/10', title:'Real-Time Tracking', desc:'Monitor every lead\'s journey from first contact to closed deal in a beautiful dashboard.' },
              { icon: '🔍', color: 'from-blue-500/20 to-blue-600/10',  title:'Smart Search',     desc:'Find any lead instantly with powerful search across names, emails, and messages.' },
              { icon: '📊', color: 'from-cyan-500/20 to-cyan-600/10',  title:'Status Pipeline',  desc:'Keep your pipeline organized with New, Contacted, and Closed status labels.' },
            ].map((f) => (
              <div key={f.title}
                className="glass-card p-7 flex flex-col gap-4 hover:-translate-y-1 hover:border-white/[0.12] hover:glow-brand transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl`}>{f.icon}</div>
                <h3 className="font-bold text-slate-100">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / Lead Form ── */}
      <section id="contact" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-14 items-start">
          {/* Left info */}
          <div className="flex flex-col gap-6 pt-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 rounded-full w-fit">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Let's build something great together</h2>
            <p className="text-slate-400 leading-relaxed">Fill out the form and our team will get back to you within 24 hours. We look forward to learning about your project.</p>
            {[
              'Free consultation call included',
              'Response within 24 hours',
              'No commitment required',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                </div>
                {item}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="glass-card p-8 relative overflow-hidden glow-brand">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 to-blue-500" />

            {success ? (
              <div className="flex flex-col items-center gap-5 py-12 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Message Sent! 🎉</h3>
                  <p className="text-slate-400 text-sm">We'll be in touch within 24 hours.</p>
                </div>
                <button onClick={() => setSuccess(false)} className="btn-ghost text-sm">Send another message</button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h3 className="text-xl font-bold">Send us a message</h3>
                  <p className="text-xs text-slate-500 mt-1">All fields are required</p>
                </div>
                <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                  <Field id="name" label="Full Name" error={touched.name && errors.name}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      <input id="name" name="name" type="text" value={form.name}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="John Doe" maxLength={100}
                        className={`input-field pl-10 ${touched.name && errors.name ? 'input-error' : ''}`} />
                    </div>
                  </Field>

                  <Field id="email" label="Email Address" error={touched.email && errors.email}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input id="email" name="email" type="email" value={form.email}
                        onChange={handleChange} onBlur={handleBlur}
                        placeholder="john@company.com"
                        className={`input-field pl-10 ${touched.email && errors.email ? 'input-error' : ''}`} />
                    </div>
                  </Field>

                  <Field id="budgetRange" label="Budget Range" error={touched.budgetRange && errors.budgetRange}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </span>
                      <select id="budgetRange" name="budgetRange" value={form.budgetRange}
                        onChange={handleChange} onBlur={handleBlur}
                        className={`input-field pl-10 appearance-none cursor-pointer ${touched.budgetRange && errors.budgetRange ? 'input-error' : ''}`}>
                        <option value="">Select your budget</option>
                        {BUDGET_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                      </span>
                    </div>
                  </Field>

                  <Field id="message" label="Message" error={touched.message && errors.message} charCount={form.message.length}>
                    <textarea id="message" name="message" value={form.message}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="Tell us about your project, goals, timeline..."
                      rows={5} maxLength={2000}
                      className={`input-field resize-none leading-relaxed ${touched.message && errors.message ? 'input-error' : ''}`} />
                  </Field>

                  <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                    {loading ? (
                      <>
                        <svg className="animate-spin-slow w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-bold text-sm">LeadDesk</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 LeadDesk. Built for growing businesses.</p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}