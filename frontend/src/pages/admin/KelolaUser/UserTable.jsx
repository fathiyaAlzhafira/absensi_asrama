import React from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { Edit2, Trash2 } from 'lucide-react';

export default function UserTable({
  loading,
  usersCount,
  filteredUsers,
  onEdit,
  onDelete
}) {
  return (
    <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-l2)',
                color: 'var(--color-neutral)',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <th style={{ padding: '16px' }}>Nama Lengkap</th>
              <th style={{ padding: '16px' }}>Role</th>
              <th style={{ padding: '16px' }}>Penempatan / Binaan</th>
              <th style={{ padding: '16px' }}>NIM / No Identitas</th>
              <th style={{ padding: '16px' }}>Jenis Kelamin</th>
              <th style={{ padding: '16px' }}>Asal Daerah</th>
              <th style={{ padding: '16px' }}>Kontak &amp; Email</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && usersCount === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                  Memuat data pengguna dari database...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                  Tidak ada data pengguna yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px' }}>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>{u.nama}</strong>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={u.role === 'fasil' ? 'warning' : 'success'} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>
                    {u.role === 'fasil' ? (
                      u.gedung ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600' }}>{u.gedung}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                            {u.lantai ? `Lantai ${u.lantai}` : 'Semua Lantai'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-neutral)', fontStyle: 'italic' }}>Belum ditugaskan</span>
                      )
                    ) : u.role === 'penghuni' ? (
                      u.gedung && u.kamar ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600' }}>{u.gedung}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>
                            Kamar {u.kamar} (Lt. {u.lantai || 1})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-neutral)', fontStyle: 'italic' }}>Belum ditempatkan</span>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{u.nim || '-'}</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>
                    {u.jekel === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{u.asal || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--color-text-primary)' }}>{u.email}</div>
                    {u.no_hp && <div style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>{u.no_hp}</div>}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Button size="sm" variant="ghost" icon={Edit2} onClick={() => onEdit(u)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => onDelete(u.id, u.nama)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
