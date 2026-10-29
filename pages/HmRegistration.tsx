import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Loader2, CheckCircle2, AlertCircle, Trash2, School } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HmRegistration } from '@/types';

const emptyForm = {
  name: '',
  school_type: '',
  school_code: '',
  school_name: '',
  phone_number: '',
};

const SCHOOL_TYPES = ['Primary', 'Secondary', 'Higher Secondary', 'Pre-University'];

export default function HmRegistration() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [records, setRecords] = useState<HmRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('hm_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const { error } = await supabase.from('hm_registrations').insert({
      name: form.name.trim(),
      school_type: form.school_type.trim(),
      school_code: form.school_code.trim(),
      school_name: form.school_name.trim(),
      phone_number: form.phone_number.trim(),
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(`${form.name} has been registered successfully.`);
    setForm(emptyForm);
    loadRecords();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hm_registrations').delete().eq('id', id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">HM Registration</h2>
        <p className="text-slate-500 text-sm mt-1">Register a new Head Master with school details.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Head Master name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">School Type</label>
            <select
              required
              value={form.school_type}
              onChange={(e) => setForm({ ...form, school_type: e.target.value })}
              className={inputClass}
            >
              <option value="" disabled>Select school type</option>
              {SCHOOL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">School Code</label>
            <input
              type="text"
              required
              value={form.school_code}
              onChange={(e) => setForm({ ...form, school_code: e.target.value })}
              placeholder="e.g. SCH-001"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
            <input
              type="text"
              required
              value={form.school_name}
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
              placeholder="School name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              required
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="Phone number"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-60 shadow-lg shadow-blue-600/30"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <UserPlus className="w-5 h-5" /> Submit Registration
            </>
          )}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Registered Head Masters</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No registrations yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 font-medium">
                  {r.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium truncate">{r.name}</p>
                  <p className="text-slate-400 text-xs truncate">
                    {r.school_name} · {r.school_type} · {r.school_code} · {r.phone_number}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
