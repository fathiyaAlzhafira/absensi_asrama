<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class AddGedungAndLantaiToUsers extends BaseMigration
{
    public function up(): void
    {
        $table = $this->table('users');
        if (!$table->hasColumn('gedung_id')) {
            $table->addColumn('gedung_id', 'integer', [
                'default' => null,
                'limit' => 10,
                'null' => true,
                'signed' => false,
                'after' => 'kamar_id',
            ]);
        }
        if (!$table->hasColumn('lantai')) {
            $table->addColumn('lantai', 'integer', [
                'default' => null,
                'null' => true,
                'after' => 'gedung_id',
            ]);
        }
        $table->update();

        // Sinkronisasi data gedung_id dan lantai untuk penghuni yang sudah memiliki kamar
        $this->execute("UPDATE users u INNER JOIN kamars k ON u.kamar_id = k.id SET u.gedung_id = k.gedung_id, u.lantai = k.lantai WHERE u.kamar_id IS NOT NULL");

        // Sinkronisasi data gedung_id untuk fasil jika sebelumnya terdaftar di gedungs.id_user
        $this->execute("UPDATE users u INNER JOIN gedungs g ON g.id_user = u.id SET u.gedung_id = g.id WHERE u.role = 'fasil'");
    }

    public function down(): void
    {
        $table = $this->table('users');
        if ($table->hasColumn('lantai')) {
            $table->removeColumn('lantai');
        }
        if ($table->hasColumn('gedung_id')) {
            $table->removeColumn('gedung_id');
        }
        $table->update();
    }
}
