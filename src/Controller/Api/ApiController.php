<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
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
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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
}
