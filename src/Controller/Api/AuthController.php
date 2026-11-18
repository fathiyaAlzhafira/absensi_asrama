<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;
use DateTimeImmutable;
use DateTimeZone;

class AuthController extends ApiController
{
    private const LEGACY_DEMO_PASSWORD_HASH = '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe';

    /**
     * POST /api/auth/login
     *
     * Login menggunakan email atau NIM.
     * Token asli hanya dikirim ke frontend satu kali.
     * Database hanya menyimpan SHA-256 token.
     */
    public function login(): Response
    {
        $this->request->allowMethod(['post', 'options']);

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $data = $this->request->getData();

        $identity = trim((string)($data['email'] ?? $data['nim'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($identity === '' || $password === '') {
            return $this->jsonError(
                'Email/NIM dan password wajib diisi.',
                422
            );
        }

        $usersTable = $this->fetchTable('Users');

        // Cari akun berdasarkan email atau NIM.
        $user = $usersTable->find()
            ->where([
                'OR' => [
                    'Users.email' => $identity,
                    'Users.nim' => $identity,
                ],
            ])
            ->contain([
                'Kamars' => ['Gedungs'],
            ])
            ->first();

        if (!$user) {
            return $this->jsonError(
                'Email/NIM atau password salah.',
                401
            );
        }

        if (!$this->verifyStoredPassword($password, (string)$user->password)) {
            return $this->jsonError(
                'Email/NIM atau password salah.',
                401
            );
        }

        // Pastikan role akun valid.
        $allowedRoles = ['admin', 'fasil', 'penghuni'];

        if (!in_array($user->role, $allowedRoles, true)) {
            return $this->jsonError(
                'Role akun tidak valid.',
                403
            );
        }

        // Buat token acak yang tidak dapat ditebak.
        $plainToken = bin2hex(random_bytes(32));

        // Simpan hash token, bukan token aslinya.
        $tokenHash = hash('sha256', $plainToken);

        // Token berlaku selama 30 hari.
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
        $expiresAt = $now->modify('+30 days');

        $tokensTable = $this->fetchTable('AuthTokens');

        $tokenEntity = $tokensTable->newEntity([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            'created_at' => $now->format('Y-m-d H:i:s'),
        ]);

        if (!$tokensTable->save($tokenEntity)) {
            return $this->jsonError(
                'Gagal membuat sesi autentikasi.',
                500
            );
        }

        // Susun informasi gedung dan kamar.
        $kamar = $user->kamar ?? null;
        $gedung = $kamar ? ($kamar->gedung ?? null) : null;

        // Jika fasilitator, ambil gedung binaan dari tabel gedungs berdasarkan id_user
        if (!$gedung && $user->role === 'fasil') {
            $gedungsTable = $this->fetchTable('Gedungs');
            $gedung = $gedungsTable->find()
                ->where(['Gedungs.id_user' => $user->id])
                ->first();
        }

        $userData = [
            'id' => $user->id,
            'nama' => $user->nama,
            'nim' => $user->nim,
            'email' => $user->email,
            'role' => $user->role,
            'asal' => $user->asal,
            'jekel' => $user->jekel,
            'no_hp' => $user->no_hp,
            'kamar_id' => $user->kamar_id,
            'nomor_kamar' => $kamar ? $kamar->nomor_kamar : null,
            'gedung' => $gedung ? $gedung->nama : 'Asrama Unand',
            'gedung_id' => $gedung ? $gedung->id : null,
            'token' => $plainToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->format(DATE_ATOM),
        ];

        return $this->jsonSuccess(
            $userData,
            'Login berhasil. Selamat datang!'
        );
    }

    /**
     * GET /api/auth/profile
     * PUT /api/auth/profile
     *
     * Profil hanya dapat diakses dengan token valid.
     */
    public function profile(): Response
    {
        $this->request->allowMethod(['get', 'put', 'options']);

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->authenticateUser();

        if (!$user) {
            return $this->jsonError(
                'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.',
                401
            );
        }

        if ($this->request->is('put')) {
            $data = $this->request->getData();

            $allowedFields = [
                'nama',
                'asal',
                'jekel',
                'no_hp',
                'foto_profil',
            ];

            $safeData = array_intersect_key(
                $data,
                array_flip($allowedFields)
            );

            $usersTable = $this->fetchTable('Users');

            $user = $usersTable->patchEntity(
                $user,
                $safeData,
                ['fields' => $allowedFields]
            );

            if (!$usersTable->save($user)) {
                return $this->jsonError(
                    'Gagal memperbarui profil.',
                    422,
                    $user->getErrors()
                );
            }

            $user = $usersTable->find()
                ->where(['Users.id' => $user->id])
                ->contain(['Kamars' => ['Gedungs']])
                ->first();
        }

        $kamar = $user->kamar ?? null;
        $gedung = $kamar ? ($kamar->gedung ?? null) : null;

        // Jika fasilitator, ambil gedung binaan dari tabel gedungs berdasarkan id_user
        if (!$gedung && $user->role === 'fasil') {
            $gedungsTable = $this->fetchTable('Gedungs');
            $gedung = $gedungsTable->find()
                ->where(['Gedungs.id_user' => $user->id])
                ->first();
        }

        return $this->jsonSuccess([
            'id' => $user->id,
            'nama' => $user->nama,
            'nim' => $user->nim,
            'email' => $user->email,
            'role' => $user->role,
            'asal' => $user->asal,
            'jekel' => $user->jekel,
            'no_hp' => $user->no_hp,
            'foto_profil' => $user->foto_profil,
            'kamar_id' => $user->kamar_id,
            'nomor_kamar' => $kamar ? $kamar->nomor_kamar : null,
            'gedung' => $gedung ? $gedung->nama : 'Asrama Unand',
            'gedung_id' => $gedung ? $gedung->id : null,
        ]);
    }

    /**
     * Ganti password akun yang sedang masuk
     * POST /api/auth/change-password
     */
    public function changePassword(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $data = $this->request->getData();
        $passwordLama = (string)($data['password_lama'] ?? '');
        $passwordBaru = (string)($data['password_baru'] ?? '');

        if ($passwordLama === '' || $passwordBaru === '') {
            return $this->jsonError('Password lama dan password baru wajib diisi.', 422);
        }
        if (strlen($passwordBaru) < 8) {
            return $this->jsonError('Password baru minimal 8 karakter.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($user->id);

        if (!$this->verifyStoredPassword($passwordLama, (string)$user->password)) {
            return $this->jsonError('Password lama tidak sesuai.', 401);
        }

        $user->password = password_hash($passwordBaru, PASSWORD_DEFAULT);
        if ($usersTable->save($user)) {
            $currentTokenHash = $this->bearerTokenHash();
            if ($currentTokenHash !== null) {
                $this->fetchTable('AuthTokens')->deleteAll([
                    'user_id' => $user->id,
                    'token_hash !=' => $currentTokenHash,
                ]);
            }
            return $this->jsonSuccess([], 'Password berhasil diubah.');
        }

        return $this->jsonError('Password gagal diperbarui.', 422, $user->getErrors());
    }

    /**
     * Simpan Kata Sandi Baru dari Lupa Kata Sandi (Tanpa Email)
     * POST /api/auth/reset-password
     */
    public function resetPassword(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $data = $this->request->getData();
        $emailInput = trim((string)($data['email'] ?? ''));
        $passwordBaru = (string)($data['password_baru'] ?? '');

        if ($emailInput === '' || $passwordBaru === '') {
            return $this->jsonError('Email/NIM dan kata sandi baru wajib diisi.', 422);
        }

        if (strlen($passwordBaru) < 6) {
            return $this->jsonError('Kata sandi baru minimal 6 karakter.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()
            ->where(['OR' => [
                'Users.email' => $emailInput,
                'Users.nim' => $emailInput,
            ]])
            ->first();

        if ($user === null) {
            return $this->jsonError('Akun dengan Email atau NIM tersebut tidak ditemukan.', 404);
        }

        $user->password = password_hash($passwordBaru, PASSWORD_DEFAULT);
        if ($usersTable->save($user)) {
            return $this->jsonSuccess([], 'Kata sandi baru berhasil disimpan! Silakan masuk dengan kata sandi baru Anda.');
        }

        return $this->jsonError('Gagal menyimpan kata sandi baru.', 500);
    }

    private function verifyStoredPassword(string $plainPassword, string $storedPassword): bool
    {
        return password_verify($plainPassword, $storedPassword)
            || hash_equals($storedPassword, $plainPassword)
            || (
                hash_equals(self::LEGACY_DEMO_PASSWORD_HASH, $storedPassword)
                && $plainPassword === 'password123'
            );
    }

    /**
     * POST /api/auth/logout
     *
     * Hapus token dari database sehingga token tidak bisa digunakan lagi.
     */
    public function logout(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $tokenHash = $this->bearerTokenHash();
        if ($tokenHash !== null) {
            $this->fetchTable('AuthTokens')->deleteAll([
                'user_id' => $user->id,
                'token_hash' => $tokenHash,
            ]);
        }

        return $this->jsonSuccess([], 'Logout berhasil.');
    }
}
