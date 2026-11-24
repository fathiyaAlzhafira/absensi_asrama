import React from 'react';
import Button from '../../../components/common/Button';
import { UserPlus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useKelolaUser } from './useKelolaUser';
import UserFilterBar from './UserFilterBar';
import UserTable from './UserTable';
import UserModal from './UserModal';

export default function KelolaUser() {
  const {
    users,
    loading,
    filterRole,
    setFilterRole,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    editingUserId,
    formData,
    setFormData,
    selectedGedungId,
    selectedLantai,
    roomSearch,
    setRoomSearch,
    submitting,
    formError,
    notification,
    buildingOptions,
    availableFloors,
    filteredRooms,
    defaultPasswordSuggestion,
    filteredUsers,
    loadUsers,
    handleOpenAddModal,
    handleOpenEditModal,
    handleGedungSelect,
    handleLantaiSelect,
    handleNameChange,
    handleNimChange,
    handleResetPasswordToggle,
    handleSaveUser,
    handleDeleteUser
  } = useKelolaUser();

  const totalCount = users.length;
  const penghuniCount = users.filter((u) => u.role === 'penghuni').length;
  const fasilCount = users.filter((u) => u.role === 'fasil').length;

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 className="text-page-title">Kelola Pengguna</h1>
          <p className="text-body">Kelola data akun Penghuni Asrama dan Fasilitator</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={loadUsers} disabled={loading}>
            {loading ? 'Memuat...' : 'Segarkan Data'}
          </Button>
          <Button variant="primary" size="md" icon={UserPlus} onClick={handleOpenAddModal}>
            Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: notification.type === 'success' ? 'rgba(29, 185, 84, 0.15)' : 'rgba(226, 33, 52, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: notification.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Role Tabs and Search Bar */}
      <UserFilterBar
        filterRole={filterRole}
        onFilterChange={setFilterRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={totalCount}
        penghuniCount={penghuniCount}
        fasilCount={fasilCount}
      />

      {/* Main Table */}
      <UserTable
        loading={loading}
        usersCount={totalCount}
        filteredUsers={filteredUsers}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteUser}
      />

      {/* Add / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUserId={editingUserId}
        formData={formData}
        setFormData={setFormData}
        formError={formError}
        submitting={submitting}
        selectedGedungId={selectedGedungId}
        selectedLantai={selectedLantai}
        roomSearch={roomSearch}
        setRoomSearch={setRoomSearch}
        buildingOptions={buildingOptions}
        availableFloors={availableFloors}
        filteredRooms={filteredRooms}
        defaultPasswordSuggestion={defaultPasswordSuggestion}
        onNameChange={handleNameChange}
        onNimChange={handleNimChange}
        onGedungSelect={handleGedungSelect}
        onLantaiSelect={handleLantaiSelect}
        onResetPasswordToggle={handleResetPasswordToggle}
        onSaveUser={handleSaveUser}
      />
    </div>
  );
}
