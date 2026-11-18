<?php
declare(strict_types=1);

use Migrations\BaseSeed;
use Cake\Datasource\ConnectionManager;

class InitialDataSeed extends BaseSeed
{
    /**
     * Mendapatkan koneksi database utama.
     */
    private function connection()
    {
        return ConnectionManager::get('default');
    }

    /**
     * Mengambil ID berdasarkan tabel dan kolom tertentu.
     */
    private function findId(
        string $table,
        string $column,
        string $value
    ): ?int {
        $allowed = [
            'users' => ['email'],
            'gedungs' => ['nama'],
        ];

        if (
            !isset($allowed[$table]) ||
            !in_array($column, $allowed[$table], true)
        ) {
            throw new InvalidArgumentException(
                'Tabel atau kolom tidak diizinkan.'
            );
        }

        $row = $this->connection()->execute(
            "SELECT id FROM `{$table}` WHERE `{$column}` = :value LIMIT 1",
            ['value' => $value]
        )->fetch('assoc');

        return $row ? (int)$row['id'] : null;
    }

    /**
     * Mengambil ID hasil INSERT terakhir.
     */
    private function lastInsertId(): int
    {
        $row = $this->connection()
            ->execute('SELECT LAST_INSERT_ID() AS id')
            ->fetch('assoc');

        if (!$row || empty($row['id'])) {
            throw new RuntimeException(
                'Gagal mendapatkan ID data yang baru dimasukkan.'
            );
        }

        return (int)$row['id'];
    }

    /**
     * Memasukkan akun jika belum tersedia.
     */
    private function insertUser(array $user): int
    {
        $existingId = $this->findId(
            'users',
            'email',
            $user['email']
        );

        if ($existingId !== null) {
            return $existingId;
        }

        $now = date('Y-m-d H:i:s');

        $this->connection()->execute(
            'INSERT INTO users
            (
                nama,
                nim,
                asal,
                kamar_id,
                jekel,
                email,
                password,
                role,
                no_hp,
                foto_profil,
                created_at,
                updated_at
            )
            VALUES
            (
                :nama,
                :nim,
                :asal,
                :kamar_id,
                :jekel,
                :email,
                :password,
                :role,
                :no_hp,
                :foto_profil,
                :created_at,
                :updated_at
            )',
            [
                'nama' => $user['nama'],
                'nim' => $user['nim'],
                'asal' => $user['asal'],
                'kamar_id' => $user['kamar_id'],
                'jekel' => $user['jekel'],
                'email' => $user['email'],
                'password' => password_hash(
                    $user['password'],
                    PASSWORD_DEFAULT
                ),
                'role' => $user['role'],
                'no_hp' => $user['no_hp'],
                'foto_profil' => $user['foto_profil'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return $this->lastInsertId();
    }

    /**
     * Memasukkan gedung jika belum tersedia.
     */
    private function insertGedung(
        string $nama,
        int $fasilId
    ): int {
        $existingId = $this->findId(
            'gedungs',
            'nama',
            $nama
        );

        if ($existingId !== null) {
            return $existingId;
        }

        $now = date('Y-m-d H:i:s');

        $this->connection()->execute(
            'INSERT INTO gedungs
            (
                nama,
                id_user,
                latitude,
                longitude,
                radius_meter,
                keterangan,
                created_at,
                updated_at
            )
            VALUES
            (
                :nama,
                :id_user,
                :latitude,
                :longitude,
                :radius_meter,
                :keterangan,
                :created_at,
                :updated_at
            )',
            [
                'nama' => $nama,
                'id_user' => $fasilId,
                'latitude' => '-0.91420000',
                'longitude' => '100.46190000',
                'radius_meter' => 100,
                'keterangan' => 'Gedung asrama mahasiswa',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return $this->lastInsertId();
    }

    /**
     * Memasukkan kamar jika belum tersedia.
     */
    private function insertKamar(
        int $gedungId,
        string $nomor,
        int $lantai = 1,
        int $kapasitas = 4
    ): int {
        $connection = $this->connection();

        $row = $connection->execute(
            'SELECT id FROM kamars
             WHERE gedung_id = :gedung_id
             AND nomor_kamar = :nomor_kamar
             LIMIT 1',
            [
                'gedung_id' => $gedungId,
                'nomor_kamar' => $nomor,
            ]
        )->fetch('assoc');

        if ($row) {
            return (int)$row['id'];
        }

        $now = date('Y-m-d H:i:s');

        $connection->execute(
            'INSERT INTO kamars
            (
                gedung_id,
                nomor_kamar,
                lantai,
                kapasitas,
                created_at,
                updated_at
            )
            VALUES
            (
                :gedung_id,
                :nomor_kamar,
                :lantai,
                :kapasitas,
                :created_at,
                :updated_at
            )',
            [
                'gedung_id' => $gedungId,
                'nomor_kamar' => $nomor,
                'lantai' => $lantai,
                'kapasitas' => $kapasitas,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return $this->lastInsertId();
    }

    /**
     * Memasukkan pengaturan presensi awal.
     */
    private function insertPengaturan(): void
    {
        $connection = $this->connection();

        $existing = $connection->execute(
            'SELECT id FROM pengaturan_presensi
             WHERE id = :id LIMIT 1',
            ['id' => 1]
        )->fetch('assoc');

        if ($existing) {
            return;
        }

        $now = date('Y-m-d H:i:s');

        $connection->execute(
            'INSERT INTO pengaturan_presensi
            (
                id,
                jam_subuh_mulai,
                jam_subuh_selesai,
                jam_malam_mulai,
                jam_malam_selesai,
                lat_default,
                long_default,
                radius_default_meter,
                created_at,
                updated_at
            )
            VALUES
            (
                :id,
                :jam_subuh_mulai,
                :jam_subuh_selesai,
                :jam_malam_mulai,
                :jam_malam_selesai,
                :lat_default,
                :long_default,
                :radius_default_meter,
                :created_at,
                :updated_at
            )',
            [
                'id' => 1,
                'jam_subuh_mulai' => '04:00:00',
                'jam_subuh_selesai' => '06:00:00',
                'jam_malam_mulai' => '18:00:00',
                'jam_malam_selesai' => '20:30:00',
                'lat_default' => '-0.91420000',
                'long_default' => '100.46190000',
                'radius_default_meter' => 100,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    /**
     * Menjalankan seluruh proses pengisian data awal.
     */
    public function run(): void
    {
        /*
         * 1. MEMBUAT AKUN ADMIN
         */
        $adminId = $this->insertUser([
            'nama' => 'Administrator Asrama',
            'nim' => null,
            'asal' => null,
            'kamar_id' => null,
            'jekel' => 'L',
            'email' => 'admin@absensi.test',
            'password' => 'Admin123!',
            'role' => 'admin',
            'no_hp' => null,
            'foto_profil' => null,
        ]);

        /*
         * 2. MEMBUAT AKUN FASILITATOR
         */
        $fasil1Id = $this->insertUser([
            'nama' => 'Fasilitator Gedung 1',
            'nim' => 'FAS001',
            'asal' => null,
            'kamar_id' => null,
            'jekel' => 'L',
            'email' => 'fasil1@absensi.test',
            'password' => 'Fasil123!',
            'role' => 'fasil',
            'no_hp' => null,
            'foto_profil' => null,
        ]);

        $fasil2Id = $this->insertUser([
            'nama' => 'Fasilitator Gedung 2',
            'nim' => 'FAS002',
            'asal' => null,
            'kamar_id' => null,
            'jekel' => 'P',
            'email' => 'fasil2@absensi.test',
            'password' => 'Fasil123!',
            'role' => 'fasil',
            'no_hp' => null,
            'foto_profil' => null,
        ]);

        /*
         * 3. MEMBUAT DATA GEDUNG
         */
        $gedung1Id = $this->insertGedung(
            'Gedung Asrama 1',
            $fasil1Id
        );

        $gedung2Id = $this->insertGedung(
            'Gedung Asrama 2',
            $fasil2Id
        );

        /*
         * 4. MEMBUAT DATA KAMAR
         */
        $kamar101Id = $this->insertKamar(
            $gedung1Id,
            '101',
            1,
            4
        );

        $kamar102Id = $this->insertKamar(
            $gedung1Id,
            '102',
            1,
            4
        );

        $kamar201Id = $this->insertKamar(
            $gedung2Id,
            '201',
            2,
            4
        );

        $kamar202Id = $this->insertKamar(
            $gedung2Id,
            '202',
            2,
            4
        );

        /*
         * 5. MEMBUAT DATA PENGHUNI
         */
        $penghuni = [
            [
                'nama' => 'Penghuni Contoh 1',
                'nim' => '2311522001',
                'asal' => 'Padang',
                'kamar_id' => $kamar101Id,
                'jekel' => 'L',
                'email' => 'penghuni1@absensi.test',
                'password' => 'Penghuni123!',
                'role' => 'penghuni',
                'no_hp' => null,
                'foto_profil' => null,
            ],
            [
                'nama' => 'Penghuni Contoh 2',
                'nim' => '2311522002',
                'asal' => 'Bukittinggi',
                'kamar_id' => $kamar102Id,
                'jekel' => 'L',
                'email' => 'penghuni2@absensi.test',
                'password' => 'Penghuni123!',
                'role' => 'penghuni',
                'no_hp' => null,
                'foto_profil' => null,
            ],
            [
                'nama' => 'Penghuni Contoh 3',
                'nim' => '2311522003',
                'asal' => 'Padang Panjang',
                'kamar_id' => $kamar201Id,
                'jekel' => 'P',
                'email' => 'penghuni3@absensi.test',
                'password' => 'Penghuni123!',
                'role' => 'penghuni',
                'no_hp' => null,
                'foto_profil' => null,
            ],
            [
                'nama' => 'Penghuni Contoh 4',
                'nim' => '2311522004',
                'asal' => 'Solok',
                'kamar_id' => $kamar202Id,
                'jekel' => 'P',
                'email' => 'penghuni4@absensi.test',
                'password' => 'Penghuni123!',
                'role' => 'penghuni',
                'no_hp' => null,
                'foto_profil' => null,
            ],
        ];

        foreach ($penghuni as $user) {
            $this->insertUser($user);
        }

        /*
         * 6. MEMBUAT PENGATURAN PRESENSI
         */
        $this->insertPengaturan();

        /*
         * 7. MENAMPILKAN HASIL
         */
        echo "\n========================================\n";
        echo " DATA AWAL ABSENSI ASRAMA DIPROSES\n";
        echo "========================================\n";
        echo "Admin ID                 : {$adminId}\n";
        echo "Fasilitator Gedung 1 ID  : {$fasil1Id}\n";
        echo "Fasilitator Gedung 2 ID  : {$fasil2Id}\n";
        echo "Gedung 1 ID              : {$gedung1Id}\n";
        echo "Gedung 2 ID              : {$gedung2Id}\n";
        echo "Kamar 101 ID             : {$kamar101Id}\n";
        echo "Kamar 102 ID             : {$kamar102Id}\n";
        echo "Kamar 201 ID             : {$kamar201Id}\n";
        echo "Kamar 202 ID             : {$kamar202Id}\n";
        echo "Jumlah penghuni contoh   : " . count($penghuni) . "\n";
        echo "Pengaturan presensi      : ID 1\n";
        echo "========================================\n";
    }
}
