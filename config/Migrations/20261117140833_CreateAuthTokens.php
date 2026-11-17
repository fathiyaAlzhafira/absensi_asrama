<?php
declare(strict_types=1);

use Migrations\BaseMigration;

class CreateAuthTokens extends BaseMigration
{
    /**
     * Membuat tabel auth_tokens untuk penyimpanan token autentikasi.
     *
     * Tabel ini terpisah dari tujuh tabel yang sudah ada.
     */
    public function change(): void
    {
        $table = $this->table('auth_tokens');

        $table
            ->addColumn('user_id', 'integer', [
                'limit' => 10,
                'signed' => false,
                'null' => false,
            ])
            ->addColumn('token_hash', 'string', [
                'limit' => 64,
                'null' => false,
            ])
            ->addColumn('expires_at', 'datetime', [
                'null' => false,
            ])
            ->addColumn('created_at', 'datetime', [
                'default' => 'CURRENT_TIMESTAMP',
                'null' => false,
            ])
            ->addIndex(['token_hash'], [
                'unique' => true,
                'name' => 'UQ_auth_tokens_token_hash',
            ])
            ->addIndex(['user_id'], [
                'name' => 'IDX_auth_tokens_user_id',
            ])
            ->addIndex(['expires_at'], [
                'name' => 'IDX_auth_tokens_expires_at',
            ])
            ->addForeignKey('user_id', 'users', 'id', [
                'delete' => 'CASCADE',
                'update' => 'CASCADE',
                'constraint' => 'FK_auth_tokens_users',
            ])
            ->create();
    }
}
