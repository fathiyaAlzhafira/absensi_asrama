<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class InitialMigration extends BaseMigration
{
    public bool $autoId = false;

    /**
     * Up Method.
     *
     * More information on this method is available here:
     * https://book.cakephp.org/migrations/5/guides/writing-migrations/migration-methods.html#the-up-method
     *
     * @return void
     */
    public function up(): void
    {
        $this->table('gedungs')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('nama', 'string', [
                'comment' => 'Nama Gedung Asrama, misal: Gedung Asrama Putri A',
                'default' => null,
                'limit' => 100,
                'null' => false,
            ])
            ->addColumn('id_user', 'integer', [
                'comment' => 'Fasil / Pembina penanggung jawab gedung',
                'default' => null,
                'limit' => null,
                'null' => true,
                'signed' => false,
            ])
            ->addColumn('latitude', 'decimal', [
                'comment' => 'Titik koordinat asrama untuk geofencing',
                'default' => null,
                'null' => true,
                'precision' => 10,
                'scale' => 8,
            ])
            ->addColumn('longitude', 'decimal', [
                'comment' => 'Titik koordinat asrama untuk geofencing',
                'default' => null,
                'null' => true,
                'precision' => 11,
                'scale' => 8,
            ])
            ->addColumn('radius_meter', 'integer', [
                'comment' => 'Radius toleransi presensi dalam meter',
                'default' => '100',
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('keterangan', 'text', [
                'default' => null,
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(
                $this->index('id_user')
                    ->setName('fk_gedungs_user')
            )
            ->create();

        $this->table('izins')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('user_id', 'integer', [
                'comment' => 'Penghuni yang mengajukan izin',
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('jenis_izin', 'string', [
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('tanggal_mulai', 'date', [
                'comment' => 'Mulai tanggal izin',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('tanggal_selesai', 'date', [
                'comment' => 'Sampai tanggal izin',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('keterangan', 'text', [
                'comment' => 'Alasan pengajuan izin',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('bukti_file', 'string', [
                'comment' => 'File lampiran bukti (.jpg / .pdf)',
                'default' => null,
                'limit' => 255,
                'null' => false,
            ])
            ->addColumn('status', 'string', [
                'comment' => 'Status persetujuan oleh fasil',
                'default' => 'pending',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('catatan_fasil', 'text', [
                'comment' => 'Catatan dari fasil jika disetujui / ditolak',
                'default' => null,
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('disetujui_oleh', 'integer', [
                'comment' => 'ID Fasil yang memverifikasi izin',
                'default' => null,
                'limit' => null,
                'null' => true,
                'signed' => false,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(
                $this->index('user_id')
                    ->setName('fk_izins_user')
            )
            ->addIndex(
                $this->index('disetujui_oleh')
                    ->setName('fk_izins_fasil')
            )
            ->create();

        $this->table('kamars')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('gedung_id', 'integer', [
                'comment' => 'Relasi ke tabel gedungs',
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('nomor_kamar', 'string', [
                'comment' => 'Nomor kamar, misal: 101, 204',
                'default' => null,
                'limit' => 20,
                'null' => false,
            ])
            ->addColumn('lantai', 'integer', [
                'comment' => 'Lantai kamar',
                'default' => '1',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('kapasitas', 'integer', [
                'comment' => 'Kapasitas maksimal penghuni kamar',
                'default' => '4',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(
                $this->index('gedung_id')
                    ->setName('fk_kamars_gedung')
            )
            ->create();

        $this->table('pengaturan_presensi')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('jam_subuh_mulai', 'time', [
                'default' => '04:00:00',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('jam_subuh_selesai', 'time', [
                'default' => '06:00:00',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('jam_malam_mulai', 'time', [
                'default' => '18:00:00',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('jam_malam_selesai', 'time', [
                'default' => '20:30:00',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('lat_default', 'decimal', [
                'comment' => 'Latitude Asrama Unand Limau Manis',
                'default' => '-0.91420000',
                'null' => false,
                'precision' => 10,
                'scale' => 8,
            ])
            ->addColumn('long_default', 'decimal', [
                'comment' => 'Longitude Asrama Unand Limau Manis',
                'default' => '100.46190000',
                'null' => false,
                'precision' => 11,
                'scale' => 8,
            ])
            ->addColumn('radius_default_meter', 'integer', [
                'default' => '100',
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->create();

        $this->table('presensis')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('user_id', 'integer', [
                'comment' => 'Penghuni yang melakukan presensi',
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('tanggal', 'date', [
                'comment' => 'Tanggal presensi',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('waktu', 'time', [
                'comment' => 'Jam presensi dilakukan',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('sesi', 'string', [
                'comment' => 'Subuh (04.00-06.00) / Malam (18.00-20.30)',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('lat', 'decimal', [
                'comment' => 'Latitude GPS saat presensi',
                'default' => null,
                'null' => true,
                'precision' => 10,
                'scale' => 8,
            ])
            ->addColumn('long', 'decimal', [
                'comment' => 'Longitude GPS saat presensi',
                'default' => null,
                'null' => true,
                'precision' => 11,
                'scale' => 8,
            ])
            ->addColumn('status', 'string', [
                'comment' => 'Status kehadiran',
                'default' => 'hadir',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('foto_wajah', 'string', [
                'comment' => 'File foto bukti kehadiran / selfie wajah',
                'default' => null,
                'limit' => 255,
                'null' => true,
            ])
            ->addColumn('keterangan', 'text', [
                'comment' => 'Catatan tambahan presensi',
                'default' => null,
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(
                $this->index([
                        'user_id',
                        'tanggal',
                        'sesi',
                    ])
                    ->setName('unique_user_tanggal_sesi')
                    ->setType('unique')
            )
            ->create();

        $this->table('users')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'limit' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('nama', 'string', [
                'default' => null,
                'limit' => 100,
                'null' => false,
            ])
            ->addColumn('nim', 'string', [
                'comment' => 'Nomor Induk Mahasiswa (untuk penghuni / fasil)',
                'default' => null,
                'limit' => 20,
                'null' => true,
            ])
            ->addColumn('asal', 'string', [
                'comment' => 'Daerah asal mahasiswa',
                'default' => null,
                'limit' => 100,
                'null' => true,
            ])
            ->addColumn('kamar_id', 'integer', [
                'comment' => 'Kamar tempat tinggal penghuni (FK ke kamars)',
                'default' => null,
                'limit' => null,
                'null' => true,
                'signed' => false,
            ])
            ->addColumn('jekel', 'string', [
                'comment' => 'Jenis Kelamin: L = Laki-laki, P = Perempuan',
                'default' => null,
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('email', 'string', [
                'default' => null,
                'limit' => 100,
                'null' => false,
            ])
            ->addColumn('password', 'string', [
                'default' => null,
                'limit' => 255,
                'null' => false,
            ])
            ->addColumn('role', 'string', [
                'comment' => 'Peran pengguna',
                'default' => 'penghuni',
                'limit' => null,
                'null' => false,
            ])
            ->addColumn('no_hp', 'string', [
                'default' => null,
                'limit' => 20,
                'null' => true,
            ])
            ->addColumn('foto_profil', 'string', [
                'default' => null,
                'limit' => 255,
                'null' => true,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'limit' => null,
                'null' => true,
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(
                $this->index('email')
                    ->setName('email')
                    ->setType('unique')
            )
            ->addIndex(
                $this->index('nim')
                    ->setName('nim')
                    ->setType('unique')
            )
            ->addIndex(
                $this->index('kamar_id')
                    ->setName('fk_users_kamar')
            )
            ->create();

        $this->table('gedungs')
            ->addForeignKey(
                $this->foreignKey('id_user')
                    ->setReferencedTable('users')
                    ->setReferencedColumns('id')
                    ->setDelete('SET_NULL')
                    ->setUpdate('CASCADE')
                    ->setName('fk_gedungs_user')
            )
            ->update();

        $this->table('izins')
            ->addForeignKey(
                $this->foreignKey('disetujui_oleh')
                    ->setReferencedTable('users')
                    ->setReferencedColumns('id')
                    ->setDelete('SET_NULL')
                    ->setUpdate('CASCADE')
                    ->setName('fk_izins_fasil')
            )
            ->addForeignKey(
                $this->foreignKey('user_id')
                    ->setReferencedTable('users')
                    ->setReferencedColumns('id')
                    ->setDelete('CASCADE')
                    ->setUpdate('CASCADE')
                    ->setName('fk_izins_user')
            )
            ->update();

        $this->table('kamars')
            ->addForeignKey(
                $this->foreignKey('gedung_id')
                    ->setReferencedTable('gedungs')
                    ->setReferencedColumns('id')
                    ->setDelete('CASCADE')
                    ->setUpdate('CASCADE')
                    ->setName('fk_kamars_gedung')
            )
            ->update();

        $this->table('presensis')
            ->addForeignKey(
                $this->foreignKey('user_id')
                    ->setReferencedTable('users')
                    ->setReferencedColumns('id')
                    ->setDelete('CASCADE')
                    ->setUpdate('CASCADE')
                    ->setName('fk_presensis_user')
            )
            ->update();

        $this->table('users')
            ->addForeignKey(
                $this->foreignKey('kamar_id')
                    ->setReferencedTable('kamars')
                    ->setReferencedColumns('id')
                    ->setDelete('SET_NULL')
                    ->setUpdate('CASCADE')
                    ->setName('fk_users_kamar')
            )
            ->update();
    }

    /**
     * Down Method.
     *
     * More information on this method is available here:
     * https://book.cakephp.org/migrations/5/guides/writing-migrations/migration-methods.html#the-down-method
     *
     * @return void
     */
    public function down(): void
    {
        $this->table('gedungs')
            ->dropForeignKey(
                'id_user'
            )->save();

        $this->table('izins')
            ->dropForeignKey(
                'disetujui_oleh'
            )
            ->dropForeignKey(
                'user_id'
            )->save();

        $this->table('kamars')
            ->dropForeignKey(
                'gedung_id'
            )->save();

        $this->table('presensis')
            ->dropForeignKey(
                'user_id'
            )->save();

        $this->table('users')
            ->dropForeignKey(
                'kamar_id'
            )->save();

        $this->table('gedungs')->drop()->save();
        $this->table('izins')->drop()->save();
        $this->table('kamars')->drop()->save();
        $this->table('pengaturan_presensi')->drop()->save();
        $this->table('presensis')->drop()->save();
        $this->table('users')->drop()->save();
    }
}
