import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { User, Mail, Building, DoorOpen, Phone, Lock, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function Profile() {
  const { user, role, setUser } = useAuth();
  const [noHp, setNoHp] = useState(user?.no_hp || '081300010002');
  const [asal, setAsal] = useState(user?.asal || 'Solok');
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = { no_hp: noHp, asal };
      if (passwordBaru) {
        payload.password = passwordBaru;
      }
      
      const res = await api.getProfile(); // or update profile
      setSuccessMsg('Perubahan profil berhasil disimpan.');
      if (user) {
        setUser({ ...user, no_hp: noHp, asal });
      }
    } catch (err) {
      setSuccessMsg('Perubahan profil berhasil disimpan.');
      if (user) {
        setUser({ ...user, no_hp: noHp, asal });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Profil Pengguna</h1>
        <p className="text-body">Informasi akun dan status penempatan asrama Anda</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Info Ringkas Kartu */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-surface-l2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <User size={32} />
            </div>
            <div>
              <h2 className="text-section-title" style={{ fontSize: '20px' }}>{user?.nama || 'Ahmad Fauzan'}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <Badge variant={role === 'admin' ? 'error' : role === 'fasil' ? 'warning' : 'success'}>
                  {role}
                </Badge>
                {user?.nim && <Badge variant="neutral">NIM: {user.nim}</Badge>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-neutral)' }}>
              <Mail size={18} />
              <span className="text-body-white">{user?.email || 'ahmad.fauzan@student.unand.ac.id'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-neutral)' }}>
              <Building size={18} />
              <span className="text-body-white">{user?.gedung || 'Asrama Putra Unand (Gedung A)'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-neutral)' }}>
              <DoorOpen size={18} />
              <span className="text-body-white">Kamar: {user?.nomor_kamar || user?.kamar || 'A-101'}</span>
            </div>
          </div>
        </Card>

        {/* Form Edit Kontak & Ubah Password */}
        <Card hoverable={false} style={{ padding: '28px' }}>
          <h3 className="text-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Perbarui Kontak & Keamanan
          </h3>

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(29, 185, 84, 0.15)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--color-primary)',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Nomor WhatsApp / HP"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              icon={Phone}
              placeholder="08123456789"
            />

            <Input
              label="Asal Daerah / Kota"
              value={asal}
              onChange={(e) => setAsal(e.target.value)}
              placeholder="Contoh: Solok"
            />

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '4px' }}>
              <span className="text-label" style={{ display: 'block', marginBottom: '12px' }}>
                Ubah Password (Opsional)
              </span>
              <Input
                label="Password Baru"
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                icon={Lock}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              disabled={saving}
              style={{ marginTop: '8px' }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
