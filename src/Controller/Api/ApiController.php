<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use Cake\Event\EventInterface;
use Cake\Http\Response;
use DateTimeImmutable;
use DateTimeZone;

class ApiController extends AppController
{
    /**
     * Daftar origin frontend yang diizinkan.
     * Tambahkan domain frontend produksi di sini jika sudah tersedia.
     */
    private const ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    public function initialize(): void
    {
        parent::initialize();
    }

    /**
     * Pengaturan CORS.
     */
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);

        $origin = $this->request->getHeaderLine('Origin');

        $this->response = $this->response
            ->withHeader(
                'Access-Control-Allow-Methods',
                'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            )
            ->withHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization, X-Requested-With'
            )
            ->withHeader(
                'Access-Control-Allow-Credentials',
                'true'
            )
            ->withHeader(
                'Access-Control-Max-Age',
                '86400'
            )
            ->withHeader('Vary', 'Origin');

        if (
            $origin !== '' &&
            in_array($origin, self::ALLOWED_ORIGINS, true)
        ) {
            $this->response = $this->response
                ->withHeader('Access-Control-Allow-Origin', $origin);
        }

        if ($this->request->is('options')) {
            $this->response = $this->response->withStatus(200);
        }
    }

    /**
     * Membaca token dari Authorization: Bearer <token>.
     */
    protected function getBearerToken(): ?string
    {
        $authorization = $this->request->getHeaderLine('Authorization');

        if (
            preg_match(
                '/^Bearer\s+([a-f0-9]{64})$/i',
                trim($authorization),
                $matches
            ) !== 1
        ) {
            return null;
        }

        return $matches[1];
    }

    /**
     * Memverifikasi token ke database dan mengambil pengguna.
     *
     * Mengembalikan null jika token tidak ditemukan,
     * sudah dicabut, atau kedaluwarsa.
     */
    protected function authenticateUser()
    {
        $token = $this->getBearerToken();

        if (!$token) {
            return null;
        }

        $tokenHash = hash('sha256', $token);

        $now = new DateTimeImmutable(
            'now',
            new DateTimeZone('Asia/Jakarta')
        );

        $tokensTable = $this->fetchTable('AuthTokens');

        $tokenRecord = $tokensTable->find()
            ->where([
                'token_hash' => $tokenHash,
                'expires_at >' => $now->format('Y-m-d H:i:s'),
            ])
            ->first();

        if (!$tokenRecord) {
            return null;
        }

        $usersTable = $this->fetchTable('Users');

        return $usersTable->find()
            ->where([
                'Users.id' => $tokenRecord->user_id,
            ])
            ->contain([
                'Kamars' => ['Gedungs'],
            ])
            ->first();
    }

    /**
     * Respons error autentikasi / otorisasi terakhir.
     */
    protected ?Response $authErrorResponse = null;

    /**
     * Memverifikasi autentikasi token Bearer dan otorisasi role pengguna.
     * Mengembalikan entity User jika sah, atau null jika tidak sah (serta mengisi $authErrorResponse).
     *
     * @param array<string>|string|null $allowedRoles Role yang diizinkan (misal 'admin', atau ['fasil', 'admin'])
     * @return \App\Model\Entity\User|null
     */
    protected function requireAuth($allowedRoles = null)
    {
        $this->authErrorResponse = null;
        $user = $this->authenticateUser();

        if (!$user) {
            $this->authErrorResponse = $this->jsonError(
                'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.',
                401
            );
            return null;
        }

        if ($allowedRoles !== null) {
            $roles = (array)$allowedRoles;
            if (!in_array($user->role, $roles, true)) {
                $this->authErrorResponse = $this->jsonError(
                    'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
                    403
                );
                return null;
            }
        }

        return $user;
    }

    /**
     * Mendapatkan entitas Gedung binaan fasilitator berdasarkan user yang sedang login.
     * Mengembalikan entitas Gedung jika ditemukan, atau null jika belum ditugaskan.
     * Mengisi $authErrorResponse jika terjadi kegagalan otorisasi gedung.
     *
     * @param \App\Model\Entity\User $user User fasilitator yang sudah terautentikasi
     * @return \App\Model\Entity\Gedung|null
     */
    protected function getFasilGedung($user)
    {
        $gedungsTable = $this->fetchTable('Gedungs');
        $gedung = $gedungsTable->find()
            ->where(['Gedungs.id_user' => $user->id])
            ->first();

        if (!$gedung) {
            $this->authErrorResponse = $this->jsonError(
                'Anda belum ditugaskan ke gedung asrama mana pun. Silakan hubungi administrator.',
                403
            );
            return null;
        }

        return $gedung;
    }

    /**
     * Mendapatkan daftar ID kamar (array of int) yang berada di dalam gedung tertentu.
     *
     * @param int $gedungId
     * @return array<int>
     */
    protected function getKamarIdsByGedung(int $gedungId): array
    {
        $kamarsTable = $this->fetchTable('Kamars');
        return $kamarsTable->find()
            ->select(['id'])
            ->where(['Kamars.gedung_id' => $gedungId])
            ->all()
            ->extract('id')
            ->map(fn($id) => (int)$id)
            ->toArray();
    }

    /**
     * Mendapatkan daftar ID user penghuni (array of int) yang menempati gedung tertentu.
     *
     * @param int $gedungId
     * @return array<int>
     */
    protected function getPenghuniUserIdsByGedung(int $gedungId): array
    {
        $kamarIds = $this->getKamarIdsByGedung($gedungId);
        if (empty($kamarIds)) {
            return [];
        }

        $usersTable = $this->fetchTable('Users');
        return $usersTable->find()
            ->select(['id'])
            ->where([
                'Users.role' => 'penghuni',
                'Users.kamar_id IN' => $kamarIds,
            ])
            ->all()
            ->extract('id')
            ->map(fn($id) => (int)$id)
            ->toArray();
    }

    /**
     * Format respons JSON.
     */
    protected function jsonResponse(
        array $data,
        int $status = 200
    ): Response {
        return $this->response
            ->withType('application/json')
            ->withStatus($status)
            ->withStringBody(
                (string)json_encode(
                    $data,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            );
    }

    protected function jsonSuccess(
        array $data = [],
        string $message = 'Success',
        int $status = 200
    ): Response {
        return $this->jsonResponse([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function jsonError(
        string $message = 'Error',
        int $status = 400,
        array $errors = []
    ): Response {
        return $this->jsonResponse([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
