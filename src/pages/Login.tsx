import { useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../api/apiClient'
import { authService } from '../services/authService'
import { usePermissions } from '../context/PermissionContext'

declare global {
  interface Window {
    Swal?: {
      fire: (opts: { icon?: string; title?: string; text?: string; html?: string }) => any
    }
  }
}

export default function Login() {
  const { setAuthData } = usePermissions()
  const [step, setStep] = useState<'login' | 'changePassword' | 'forgotPassword'>('login')
  const [tempData, setTempData] = useState({ email: '', oldPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
    useForm<{ loginId: string; password: string; ancienMotDePasse?: string; nouveauMotDePasse?: string; confirmation?: string; email?: string }>()

  const onLoginSubmit = async (data: { loginId: string; password: string }) => {
    try {
      const res = await api.post('Auth/login', data)
      const payload = res?.data as any
      const token = payload?.data?.token || payload?.token || payload?.access_token
      const refreshToken = payload?.data?.refreshToken || payload?.refreshToken
      const user = payload?.data?.user || payload?.data || {}

      if (token) {
        const mustChange =
          user.mustChangePassword === true ||
          user.mustChangePassword === 'true' ||
          user.MustChangePassword === true ||
          payload?.data?.mustChangePassword === true ||
          payload?.mustChangePassword === true;

        if (mustChange) {
          setTempData({
            email: user.email || user.Email || data.loginId,
            oldPassword: data.password
          })
          setStep('changePassword')
          reset()
          return
        }

        // Decode JWT to extract user info
        const decodeJWT = (token: string) => {
          try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
              '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''))
            return JSON.parse(jsonPayload)
          } catch (e) {
            console.error('Error decoding JWT:', e)
            return {}
          }
        }

        const jwtData = decodeJWT(token)
        console.log('[Login] Decoded JWT:', jwtData)

        // Build user profile from JWT claims
        const userProfile = {
          id: jwtData.UtilisateurId || jwtData.UserId || jwtData.nameid,
          nom: jwtData.Nom,
          prenoms: jwtData.Prenoms,
          email: jwtData.Email,
          role: jwtData.role,
          ...user // Include any other data from the response
        }

        const roleId = user.roleId || user.RoleId || user.role?.id || user.Role?.Id || user.idRole || user.IdRole;
        const roleName = user.roleName || user.RoleName || user.role?.libelle || user.Role?.Libelle || jwtData.role || user.role?.LibelleRole || user.role?.libelleRole || user.libelleRole;

        // Prepare permissions and admin status
        const permissions = user.permissions || user.Permissions || user.role?.permissions || [];
        const labels = Array.isArray(permissions)
          ? permissions.map((p: any) => typeof p === 'string' ? p : (p.libelle || p.Libelle))
          : [];

        const isAdm = roleId === '5965a737-73dc-485b-877e-7f9dddd22f10' ||
          String(roleName || '').toLowerCase().includes('admin') ||
          String(roleName || '').toLowerCase().includes('administrateur');

        // CRITICAL: Write ALL data to localStorage FIRST before navigation
        localStorage.setItem('auth_token', token)
        if (refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshToken)
        }
        localStorage.setItem('user_profile', JSON.stringify(userProfile)); // ← Store the decoded user profile
        localStorage.setItem('user_permissions', JSON.stringify(labels));
        localStorage.setItem('user_is_admin', isAdm ? 'true' : 'false');
        localStorage.setItem('user_role_id', String(roleId || ''));
        localStorage.setItem('user_role_name', String(roleName || ''));

        // Then update context state (this will trigger re-renders)
        setAuthData({
          permissions: labels,
          isAdmin: isAdm,
          roleId: String(roleId || ''),
          roleName: String(roleName || '')
        });

        // Force full page reload to ensure all components read from fresh localStorage
        window.location.href = '/accueil'
      } else {
        throw new Error(payload?.message || 'Token manquant')
      }
    } catch (e: any) {
      const respData = e?.response?.data;
      const message = respData?.message || e?.message || 'Identifiants invalides';

      // If the API returns an error but indicates the password MUST be changed
      // We must be very careful NOT to redirect if the error is actually "incorrect password"
      const isCredentialError =
        message.toLowerCase().includes('incorrect') ||
        message.toLowerCase().includes('invalide') ||
        message.toLowerCase().includes('invalid');

      const mustChangeInError =
        !isCredentialError && (
          respData?.mustChangePassword === true ||
          respData?.mustChangePassword === 'true' ||
          respData?.data?.mustChangePassword === true ||
          message.toLowerCase().includes('première connexion') ||
          message.toLowerCase().includes('doit être changé') ||
          message.toLowerCase().includes('must change password') ||
          message.toLowerCase().includes('veillez changer votre mot de passe')
        );

      if (mustChangeInError) {
        // Try to find email in the error response, or fallback to the login ID used
        const emailFallback = respData?.data?.email || respData?.email || data.loginId;

        setTempData({
          email: emailFallback,
          oldPassword: data.password
        });
        setStep('changePassword');
        reset();
        return;
      }

      if (window.Swal) {
        window.Swal.fire({ icon: 'error', title: 'Erreur', text: message })
      } else {
        alert(message)
      }
    }
  }

  const onChangePasswordSubmit = async (data: any) => {
    if (data.nouveauMotDePasse !== data.confirmation) {
      if (window.Swal) {
        window.Swal.fire({ icon: 'warning', title: 'Attention', text: 'Les mots de passe ne correspondent pas' })
      } else {
        alert('Les mots de passe ne correspondent pas')
      }
      return
    }

    try {
      const res = await authService.changePassword({
        email: tempData.email,
        ancienMotDePasse: data.ancienMotDePasse,
        nouveauMotDePasse: data.nouveauMotDePasse,
        confirmationNouveauMotDePasse: data.confirmation
      })

      if (res.data?.isSuccess) {
        if (window.Swal) {
          await window.Swal.fire({ icon: 'success', title: 'Succès', text: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.' })
        } else {
          alert('Mot de passe modifié avec succès')
        }
        setStep('login')
        reset()
      } else {
        throw new Error(res.data?.message || 'Erreur lors du changement de mot de passe')
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Erreur lors du changement de mot de passe'
      if (window.Swal) {
        window.Swal.fire({ icon: 'error', title: 'Erreur', text: message })
      } else {
        alert(message)
      }
    }
  }

  const onForgotPasswordSubmit = async (data: any) => {
    try {
      const res = await api.post('Users/forgot-password', data)
      const payload = res?.data as any
      if (payload?.isSuccess) {
        if (window.Swal) {
          await window.Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: payload?.message || 'Un nouveau mot de passe a été envoyé par email.'
          })
        } else {
          alert(payload?.message || 'Un nouveau mot de passe a été envoyé par email.')
        }
        setStep('login')
        reset()
      } else {
        throw new Error(payload?.message || 'Erreur lors du traitement')
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Erreur lors du traitement'
      if (window.Swal) {
        window.Swal.fire({ icon: 'error', title: 'Erreur', text: message })
      } else {
        alert(message)
      }
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="row g-0 flex-grow-1 overflow-hidden">
        {/* Left Side: Brand Visual */}
        <div className="col-lg-7 d-none d-lg-flex align-items-center justify-content-center position-relative overflow-hidden"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(13, 110, 253, 0.7) 0%, rgba(0, 31, 63, 0.8) 100%), url("/media/various/login_bg_electricity.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
          <div className="position-absolute w-100 h-100" style={{ opacity: 0.15 }}>
            <div className="position-absolute" style={{ top: '10%', left: '10%', width: '300px', height: '300px', background: '#ffffff', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 20s infinite alternate' }}></div>
            <div className="position-absolute" style={{ bottom: '15%', right: '10%', width: '250px', height: '250px', background: '#0d6efd', borderRadius: '50%', filter: 'blur(100px)', animation: 'float 15s infinite alternate-reverse' }}></div>
          </div>

          <div className="p-5 text-center position-relative animate__animated animate__zoomIn" style={{ zIndex: 10 }}>
            <div className="mb-4 d-inline-block p-4 rounded-circle bg-white-10 backdrop-blur" style={{ backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <img src="/dlms-logo-simple.svg" alt="DLMS Logo" style={{ width: '80px', height: '80px' }} />
            </div>
            <h1 className="display-3 fw-bold text-white mb-2 tracking-tighter">PLATEFORME <span className="fw-light opacity-75">DLMS</span></h1>
            <p className="fs-lg text-white-75 mb-0 fw-medium">Système de Télé-relève & Gestion de Données</p>
            <div className="mt-5 d-flex justify-content-center gap-4 text-white-50">
              <div className="d-flex align-items-center"><i className="fa fa-shield-alt me-2"></i> Sécurisé</div>
              <div className="d-flex align-items-center"><i className="fa fa-bolt me-2"></i> Temps réel</div>
              <div className="d-flex align-items-center"><i className="fa fa-chart-line me-2"></i> Analytique</div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="col-lg-5 d-flex align-items-center justify-content-center bg-white">
          <div className="p-4 p-sm-5 w-100" style={{ maxWidth: '480px' }}>
            <div className="text-center mb-5 animate__animated animate__fadeInUp">
              <div className="d-lg-none mb-4">
                <img src="/dlms-logo-simple.svg" alt="DLMS Logo" style={{ width: '60px', height: '60px' }} />
                <h2 className="h1 fw-bold mt-2">DLMS</h2>
              </div>
              <h2 className="fw-bold text-dark mb-1">DLMS</h2>
              <p className="text-muted fw-medium">
                {step === 'login' ? 'Veuillez entrer vos identifiants pour continuer' :
                  step === 'changePassword' ? 'Votre mot de passe doit être changé lors de votre première connexion.' :
                    'Veuillez entrer votre email pour réinitialiser votre mot de passe'}
              </p>
            </div>

            {step === 'login' ? (
              <form onSubmit={handleSubmit(onLoginSubmit)} className="animate__animated animate__fadeInRight">
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary small text-uppercase">Identifiant</label>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-user text-muted opacity-50"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="votre.identifiant"
                      {...register('loginId', { required: true })}
                    />
                  </div>
                  {errors.loginId && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <i className="fa-solid fa-circle-exclamation me-1"></i> Identifiant requis
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label fw-semibold text-secondary small text-uppercase">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => { setStep('forgotPassword'); reset(); }}
                      className="btn btn-link p-0 small text-primary text-decoration-none fw-medium border-0 shadow-none"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-lock text-muted opacity-50"></i>
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="••••••••"
                      {...register('password', { required: true })}
                    />
                    <button
                      type="button"
                      className="btn bg-transparent border-0 text-muted"
                      onClick={() => setShowPass(!showPass)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} opacity-50`}></i>
                    </button>
                  </div>
                  {errors.password && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <i className="fa-solid fa-circle-exclamation me-1"></i> Mot de passe requis
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-login-custom btn-lg w-100 fw-bold py-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Vérification...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <i className="fa-solid fa-arrow-right-long fs-5"></i>
                    </>
                  )}
                </button>
              </form>
            ) : step === 'changePassword' ? (
              <form onSubmit={handleSubmit(onChangePasswordSubmit)} className="animate__animated animate__fadeInRight">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary small text-uppercase">Ancien mot de passe</label>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-lock-open text-muted opacity-50"></i>
                    </span>
                    <input
                      type={showOld ? 'text' : 'password'}
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="Ancien mot de passe"
                      {...register('ancienMotDePasse', { required: true })}
                      defaultValue={tempData.oldPassword}
                    />
                    <button
                      type="button"
                      className="btn bg-transparent border-0 text-muted"
                      onClick={() => setShowOld(!showOld)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showOld ? 'fa-eye-slash' : 'fa-eye'} opacity-50`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary small text-uppercase">Nouveau mot de passe</label>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-key text-muted opacity-50"></i>
                    </span>
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="••••••••"
                      {...register('nouveauMotDePasse', { required: true, minLength: 6 })}
                    />
                    <button
                      type="button"
                      className="btn bg-transparent border-0 text-muted"
                      onClick={() => setShowNew(!showNew)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'} opacity-50`}></i>
                    </button>
                  </div>
                  {errors.nouveauMotDePasse && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <i className="fa-solid fa-circle-exclamation me-1"></i> Le mot de passe doit contenir au moins 6 caractères
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary small text-uppercase">Confirmation</label>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-check-circle text-muted opacity-50"></i>
                    </span>
                    <input
                      type={showConf ? 'text' : 'password'}
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="••••••••"
                      {...register('confirmation', { required: true })}
                    />
                    <button
                      type="button"
                      className="btn bg-transparent border-0 text-muted"
                      onClick={() => setShowConf(!showConf)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showConf ? 'fa-eye-slash' : 'fa-eye'} opacity-50`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-premium-green btn-lg w-100 fw-bold py-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      Changer mot de passe
                      <i className="fa-solid fa-check fs-5"></i>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-link w-100 text-muted mt-3 text-decoration-none small"
                  onClick={() => setStep('login')}
                  disabled={isSubmitting}
                >
                  <i className="fa fa-arrow-left me-1"></i> Retour à la connexion
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onForgotPasswordSubmit as any)} className="animate__animated animate__fadeInRight">
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary small text-uppercase">Adresse Email</label>
                  <div className="input-group input-group-lg border rounded-3 transition-all focus-within-primary">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                      <i className="fa-solid fa-envelope text-muted opacity-50"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-0 bg-transparent shadow-none"
                      placeholder="votre@email.com"
                      {...register('email', {
                        required: 'Email requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email invalide"
                        }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <div className="text-danger small mt-2 d-flex align-items-center">
                      <i className="fa-solid fa-circle-exclamation me-1"></i> {errors.email.message}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-login-custom btn-lg w-100 fw-bold py-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Réinitialiser le mot de passe
                      <i className="fa-solid fa-paper-plane fs-5"></i>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-link w-100 text-muted mt-3 text-decoration-none small"
                  onClick={() => { setStep('login'); reset(); }}
                  disabled={isSubmitting}
                >
                  <i className="fa fa-arrow-left me-1"></i> Retour à la connexion
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <p className="text-muted small mb-0">
                Tableau de bord DLMS &copy; {new Date().getFullYear()}
              </p>
              <p className="text-muted small">
                Tous droits réservés. Version 1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        .backdrop-blur {
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
        }
        .transition-all {
          transition: all 0.2s ease;
        }
        .focus-within-primary:focus-within {
          border-color: #0d6efd !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
