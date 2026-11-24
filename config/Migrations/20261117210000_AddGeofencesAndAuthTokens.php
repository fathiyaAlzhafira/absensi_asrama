<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class AddGeofencesAndAuthTokens extends BaseMigration
{
    public bool $autoId = false;

    public function change(): void
    {
        $this->table('gedungs')
            ->addColumn('geofence_geojson', 'text', [
                'default' => null,
                'null' => true,
            ])
            ->addColumn('is_active', 'boolean', [
                'default' => true,
                'null' => false,
            ])
            ->update();

        $this->table('kamars')
            ->addIndex(['gedung_id', 'nomor_kamar'], [
                'unique' => true,
                'name' => 'uq_kamars_gedung_nomor',
            ])
            ->update();

        if (!$this->hasTable('auth_tokens')) {
            $this->table('auth_tokens')
                ->addColumn('id', 'integer', [
                    'autoIncrement' => true,
                    'default' => null,
                    'null' => false,
                    'signed' => false,
                ])
                ->addPrimaryKey(['id'])
                ->addColumn('user_id', 'integer', [
                    'default' => null,
                    'null' => false,
                    'signed' => false,
                ])
                ->addColumn('token_hash', 'string', [
                    'limit' => 64,
                    'null' => false,
                ])
                ->addColumn('expires_at', 'datetime', [
                    'default' => null,
                    'null' => false,
                ])
                ->addColumn('created_at', 'datetime', [
                    'default' => null,
                    'null' => true,
                ])
                ->addIndex(['token_hash'], ['unique' => true, 'name' => 'uq_auth_tokens_hash'])
                ->addIndex(['user_id'], ['name' => 'idx_auth_tokens_user'])
                ->create();

            $this->table('auth_tokens')
                ->addForeignKey(
                    $this->foreignKey('user_id')
                        ->setReferencedTable('users')
                        ->setReferencedColumns('id')
                        ->setDelete('CASCADE')
                        ->setUpdate('CASCADE')
                        ->setName('fk_auth_tokens_user')
                )
                ->update();
        }
    }
}
