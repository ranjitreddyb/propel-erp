'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, ArrowRight, RefreshCw, Building2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      toast.success('OTP sent to your mobile');
      setStep('otp');
      setResendTimer(30);
      
      // Store debug OTP if provided (dev mode)
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store token and user data
      localStorage.setItem('propel_token', data.token);
      localStorage.setItem('propel_user', JSON.stringify(data.user));
      localStorage.setItem('propel_company', JSON.stringify(data.company));
      localStorage.setItem('propel_companies', JSON.stringify(data.companies));

      toast.success(`Welcome, ${data.user.firstName}!`);
      router.replace('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      toast.success('OTP resent successfully');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    setDebugOtp(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#FDFBF7',
        backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(32,58,43,0.08) 0%, transparent 60%)`,
      }}
    >
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #203A2B, #2A4C38)',
              boxShadow: '0 8px 32px rgba(32,58,43,0.3)',
            }}
          >
            <Building2 size={32} className="text-white" />
          </div>
          <h1 
            className="text-3xl font-semibold tracking-tight" 
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#203A2B' }}
          >
            Supratik
          </h1>
          <p className="text-sm mt-1" style={{ color: '#7A756C' }}>
            Property Management System
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border"
          style={{ background: '#FFFFFF', borderColor: '#E8E2D9', boxShadow: '0 4px 24px rgba(32,58,43,0.06)' }}
        >
          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-bold mb-2">Sign in with Mobile</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                Enter your registered mobile number to receive OTP
              </p>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: 'var(--text2)' }}
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                      style={{ color: 'var(--text2)' }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="form-input pl-12"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      required
                      autoFocus
                      data-testid="phone-input"
                    />
                    <Phone
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text3)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
                  }}
                  data-testid="send-otp-btn"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  {loading ? 'Sending OTP...' : 'Get OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={handleBack}
                  className="p-1 rounded hover:bg-white/10 transition"
                  style={{ color: 'var(--text2)' }}
                >
                  <ArrowRight size={16} className="rotate-180" />
                </button>
                <h2 className="text-lg font-bold">Enter OTP</h2>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  +91 {phone}
                </span>
              </p>

              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-bold rounded-lg border-2 focus:border-blue-500 focus:outline-none transition"
                    style={{
                      background: 'var(--bg)',
                      borderColor: digit ? 'var(--accent)' : 'var(--border)',
                      color: 'var(--text)',
                    }}
                    maxLength={1}
                    data-testid={`otp-input-${i}`}
                  />
                ))}
              </div>

              {/* Debug OTP hint for development */}
              {debugOtp && (
                <div
                  className="text-center text-xs mb-4 py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--accent)' }}
                >
                  <Shield size={12} className="inline mr-1" />
                  Demo OTP: <span className="font-mono font-bold">{debugOtp}</span>
                </div>
              )}

              <button
                onClick={() => handleVerifyOtp(otp.join(''))}
                disabled={loading || otp.some((d) => !d)}
                className="w-full py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
                }}
                data-testid="verify-otp-btn"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="text-center mt-4">
                <button
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-sm font-medium transition flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                  style={{ color: resendTimer > 0 ? 'var(--text3)' : 'var(--accent)' }}
                  data-testid="resend-otp-btn"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              Demo: Use any registered number, OTP is <span className="font-mono font-bold">121212</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text3)' }}>
          © 2026 WiseWit Technologies · propelerp.wisewit.ai
        </p>
      </div>
    </div>
  );
}
