import { useEffect, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, Loader2, Trash2, CheckCircle2, FileWarning, AlertCircle, Download } from 'lucide-react';
import { supabase, EXAM_BUCKET } from '@/lib/supabase';
import type { Exam } from '@/types';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXT = ['.pdf', '.doc', '.docx'];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadExam() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");

  const loadExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setExams(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    const isAccepted =
      ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAccepted) {
      setError('Only PDF or Word (.doc, .docx) files are allowed.');
      return;
    }

    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      setError('Not signed in.');
      setUploading(false);
      return;
    }

    const filePath = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: upErr } = await supabase.storage
      .from(EXAM_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { error: dbErr } = await supabase.from('exams').insert({
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || file.name.split('.').pop() || 'unknown',
      file_size: file.size,
    });

    if (dbErr) {
      setError(dbErr.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    setSuccess(`"${file.name}" uploaded successfully.`);
    loadExams();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDelete = async (exam: Exam) => {
    setError(null);
    setSuccess(null);
    await supabase.storage.from(EXAM_BUCKET).remove([exam.file_path]);
    await supabase.from('exams').delete().eq('id', exam.id);
    setExams((prev) => prev.filter((x) => x.id !== exam.id));
    setSuccess(`"${exam.file_name}" removed.`);
  };

  const handleDownload = async (exam: Exam) => {
    const { data, error } = await supabase.storage
      .from(EXAM_BUCKET)
      .createSignedUrl(exam.file_path, 60);
    if (error) {
      setError(error.message);
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Upload Exam</h2>
        <p className="text-slate-500 text-sm mt-1">Upload PDF or Word documents for your exams.</p>
      </div>

     <div className="flex flex-col md:flex-row items-start gap-6 p-6 w-full">

  {/* Left Side - Dropdown (4 Columns) */}
  <div className="w-full md:w-1/3">
    <label className="block mb-3 text-sm font-semibold text-slate-700">
      Select Examination
    </label>

    <select
      value={selectedOption}
      onChange={(e) => setSelectedOption(e.target.value)}
      className="w-full px-4 py-3 bg-white border border-slate-300
                 rounded-xl text-slate-700 shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 focus:border-blue-500 cursor-pointer transition-all"
    >
      <option value="">Choose an option</option>
      <option value="Trust Exam">Trust Exam</option>
      <option value="NMMS Exam">NMMS Exam</option>
      <option value="CM Talent Test">CM Talent Test</option>
      <option value="NEET">NEET</option>
      <option value="JEE">JEE</option>
    </select>

    {selectedOption && (
      <p className="mt-3 text-sm text-blue-600 font-medium">
        Selected Option: {selectedOption}
      </p>
    )}
  </div>

  {/* Right Side - Upload (8 Columns) */}
  <div className="w-full md:flex-1 min-w-0">
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl
        p-8 sm:p-12 text-center transition-all ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-white hover:border-blue-400"
        }`}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onChange}
        className="hidden"
        id="exam-file-input"
      />

      <label
        htmlFor="exam-file-input"
        className="cursor-pointer flex flex-col items-center"
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center
            justify-center mb-4 transition ${
              dragging ? "bg-blue-600" : "bg-blue-100"
            }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <Upload
              className={`w-8 h-8 ${
                dragging ? "text-white" : "text-blue-600"
              }`}
            />
          )}
        </div>

        <p className="text-slate-700 font-medium">
          {uploading
            ? "Uploading..."
            : "Click to upload or drag & drop"}
        </p>

        <p className="text-slate-400 text-sm mt-1">
          PDF, DOC, or DOCX files
        </p>
      </label>
    </div>
  </div>
</div>

{/* Messages displayed below both columns */}
<div className="px-6 space-y-3">
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
</div>


      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Uploaded Files</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <FileWarning className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No exam files uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium truncate">{exam.file_name}</p>
                  <p className="text-slate-400 text-xs">
                    {formatSize(exam.file_size)} · {new Date(exam.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(exam)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exam)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition"
                  title="Delete"
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
