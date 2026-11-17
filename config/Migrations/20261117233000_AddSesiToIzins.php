<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class AddSesiToIzins extends BaseMigration
{
    public function up(): void
    {
        $table = $this->table('izins');
        if (!$table->hasColumn('sesi')) {
            $table->addColumn('sesi', 'string', [
                'default' => 'semua',
                'limit' => 20,
                'null' => false,
                'after' => 'jenis_izin',
            ])->update();
        }
    }

    public function down(): void
    {
        $table = $this->table('izins');
        if ($table->hasColumn('sesi')) {
            $table->removeColumn('sesi')->update();
        }
    }
}
