<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use App\Model\Entity\User;
use Cake\Event\EventInterface;
use Cake\Http\Response;

class ApiController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
    }

    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);

        // Header CORS untuk memperbolehkan request dari frontend React (Vite)
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Allow-Credentials', 'true');

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
    }

    protected function jsonResponse(array $data, int $status = 200): Response
    {
        return $this->response
            ->withType('application/json')
            ->withStatus($status)
            ->withStringBody((string)json_encode($data));
    }

    protected function jsonSuccess(array $data = [], string $message = 'Success', int $status = 200): Response
    {
        return $this->jsonResponse([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $status);
    }

    protected function jsonError(string $message = 'Error', int $status = 400, array $errors = []): Response
    {
        return $this->jsonResponse([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors
        ], $status);
    }

    protected function requireAuthenticatedUser(): User|Response
    {
        $authorization = trim($this->request->getHeaderLine('Authorization'));
        if (!preg_match('/\ABearer\s+(.+)\z/i', $authorization, $matches)) {
            return $this->jsonError('Sesi login tidak valid atau telah berakhir.', 401);
        }

        $rawToken = trim($matches[1]);

        // 1. Token 64-hex yang disimpan ter-hash di tabel auth_tokens
        if (preg_match('/\A[a-f0-9]{64}\z/i', $rawToken)) {
            $tokenHash = hash('sha256', strtolower($rawToken));
            $token = $this->fetchTable('AuthTokens')->find()
                ->where([
                    'AuthTokens.token_hash' => $tokenHash,
                    'AuthTokens.expires_at >' => new \DateTimeImmutable('now'),
                ])
                ->contain(['Users'])
                ->first();

            if ($token !== null && $token->user !== null) {
                return $token->user;
            }
        }

        // 2. Dukungan token pengembangan lokal (offline_token_* dari sesi browser)
        // Hanya aktif pada host lokal (localhost / 127.0.0.1) agar sesi dev tidak terputus
        $host = strtolower(explode(':', $this->request->host())[0] ?? '');
        if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
            $offlineRoles = [
                'offline_token_admin' => 'admin',
                'offline_token_fasil' => 'fasil',
                'offline_token_penghuni' => 'penghuni',
            ];
            if (isset($offlineRoles[$rawToken])) {
                $user = $this->fetchTable('Users')->find()
                    ->where(['Users.role' => $offlineRoles[$rawToken]])
                    ->orderBy(['Users.id' => 'ASC'])
                    ->first();
                if ($user !== null) {
                    return $user;
                }
            }
        }

        return $this->jsonError('Sesi login tidak valid atau telah berakhir.', 401);
    }

    protected function requireAdminUser(): User|Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        if ($user->role !== 'admin') {
            return $this->jsonError('Akses hanya untuk administrator.', 403);
        }

        return $user;
    }

    protected function bearerTokenHash(): ?string
    {
        $authorization = trim($this->request->getHeaderLine('Authorization'));
        if (!preg_match('/\ABearer\s+([a-f0-9]{64})\z/i', $authorization, $matches)) {
            return null;
        }

        return hash('sha256', strtolower($matches[1]));
    }
}
