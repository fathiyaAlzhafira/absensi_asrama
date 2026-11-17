<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateLantais extends BaseMigration
{
    public bool $autoId = false;

    public function change(): void
    {
        $this->table('lantais')
            ->addColumn('id', 'integer', [
                'autoIncrement' => true,
                'default' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addPrimaryKey(['id'])
            ->addColumn('gedung_id', 'integer', [
                'default' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('nomor_lantai', 'integer', [
                'default' => null,
                'null' => false,
                'signed' => false,
            ])
            ->addColumn('nama', 'string', [
                'default' => null,
                'limit' => 80,
                'null' => true,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => null,
                'null' => true,
            ])
            ->addColumn('updated_at', 'datetime', [
                'default' => null,
                'null' => true,
            ])
            ->addIndex(['gedung_id', 'nomor_lantai'], [
                'unique' => true,
                'name' => 'uq_lantais_gedung_nomor',
            ])
            ->create();

        $this->execute(
            'INSERT INTO lantais (gedung_id, nomor_lantai)
             SELECT DISTINCT gedung_id, lantai FROM kamars'
        );

        $this->table('lantais')
            ->addForeignKey(
                $this->foreignKey('gedung_id')
                    ->setReferencedTable('gedungs')
                    ->setReferencedColumns('id')
                    ->setDelete('CASCADE')
                    ->setUpdate('CASCADE')
                    ->setName('fk_lantais_gedung')
            )
            ->update();

        // Konsistensi kamar <-> lantai dijaga di KamarsController/LantaisController
        // (kamars.lantai bertipe signed sehingga FK komposit tidak kompatibel).
        $this->table('kamars')
            ->addIndex(['gedung_id', 'lantai'], [
                'name' => 'idx_kamars_gedung_lantai',
            ])
            ->update();
    }
}
