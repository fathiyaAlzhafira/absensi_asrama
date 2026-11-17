<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class PengaturanPresensiController extends ApiController
{
    private const DEFAULTS = [
        'jam_subuh_mulai' => '04:00',
        'jam_subuh_selesai' => '06:00',
        'jam_malam_mulai' => '18:00',
        'jam_malam_selesai' => '20:30',
    ];

    /**
     * Ambil jadwal operasional presensi Subuh & Malam.
     * GET /api/pengaturan-presensi
     */
    public function index(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        return $this->jsonSuccess($this->currentSchedule());
    }

    /**
     * Perbarui jadwal operasional presensi Subuh & Malam (Admin).
     * PUT /api/pengaturan-presensi
     */
    public function edit(): Response
    {
        $this->request->allowMethod(['put', 'post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $data = $this->request->getData();
        $fields = [
            'jam_subuh_mulai' => 'Jam mulai Subuh',
            'jam_subuh_selesai' => 'Jam selesai Subuh',
            'jam_malam_mulai' => 'Jam mulai Malam',
            'jam_malam_selesai' => 'Jam selesai Malam',
        ];
        $times = [];
        foreach ($fields as $key => $label) {
            $raw = trim((string)($data[$key] ?? ''));
            $normalized = $this->normalizeTime($raw);
            if ($normalized === null) {
                return $this->jsonError($label . ' wajib berformat jam yang valid (HH:MM).', 422);
            }
            $times[$key] = $normalized;
        }

        $subuhMulai = $this->toMinutes($times['jam_subuh_mulai']);
        $subuhSelesai = $this->toMinutes($times['jam_subuh_selesai']);
        $malamMulai = $this->toMinutes($times['jam_malam_mulai']);
        $malamSelesai = $this->toMinutes($times['jam_malam_selesai']);

        if ($subuhSelesai <= $subuhMulai) {
            return $this->jsonError('Jam selesai Subuh harus setelah jam mulai Subuh.', 422);
        }
        if ($malamSelesai <= $malamMulai) {
            return $this->jsonError('Jam selesai Malam harus setelah jam mulai Malam.', 422);
        }
        if ($malamMulai < $subuhSelesai) {
            return $this->jsonError('Jadwal Malam tidak boleh bertabrakan dengan jadwal Subuh.', 422);
        }

        $table = $this->fetchTable('PengaturanPresensi');
        $record = $table->find()->orderBy(['PengaturanPresensi.id' => 'ASC'])->first();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        if ($record === null) {
            $record = $table->newEntity([
                'jam_subuh_mulai' => $times['jam_subuh_mulai'] . ':00',
                'jam_subuh_selesai' => $times['jam_subuh_selesai'] . ':00',
                'jam_malam_mulai' => $times['jam_malam_mulai'] . ':00',
                'jam_malam_selesai' => $times['jam_malam_selesai'] . ':00',
                'lat_default' => '-0.91420000',
                'long_default' => '100.46190000',
                'radius_default_meter' => 100,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $record = $table->patchEntity($record, [
                'jam_subuh_mulai' => $times['jam_subuh_mulai'] . ':00',
                'jam_subuh_selesai' => $times['jam_subuh_selesai'] . ':00',
                'jam_malam_mulai' => $times['jam_malam_mulai'] . ':00',
                'jam_malam_selesai' => $times['jam_malam_selesai'] . ':00',
                'updated_at' => $now,
            ]);
        }

        if (!$table->save($record)) {
            return $this->jsonError('Gagal menyimpan pengaturan jadwal presensi.', 422, $record->getErrors());
        }

        return $this->jsonSuccess($this->currentSchedule(), 'Jadwal presensi berhasil disimpan.');
    }

    /**
     * @return array<string, string>
     */
    private function currentSchedule(): array
    {
        try {
            $record = $this->fetchTable('PengaturanPresensi')
                ->find()
                ->orderBy(['PengaturanPresensi.id' => 'ASC'])
                ->first();
            if ($record === null) {
                return self::DEFAULTS;
            }

            return [
                'jam_subuh_mulai' => $this->formatTimeField($record->jam_subuh_mulai, self::DEFAULTS['jam_subuh_mulai']),
                'jam_subuh_selesai' => $this->formatTimeField($record->jam_subuh_selesai, self::DEFAULTS['jam_subuh_selesai']),
                'jam_malam_mulai' => $this->formatTimeField($record->jam_malam_mulai, self::DEFAULTS['jam_malam_mulai']),
                'jam_malam_selesai' => $this->formatTimeField($record->jam_malam_selesai, self::DEFAULTS['jam_malam_selesai']),
            ];
        } catch (\Throwable) {
            return self::DEFAULTS;
        }
    }

    private function formatTimeField(mixed $value, string $fallback): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('H:i');
        }
        $normalized = $this->normalizeTime((string)$value);

        return $normalized ?? $fallback;
    }

    private function normalizeTime(string $value): ?string
    {
        $clean = str_replace('.', ':', trim($value));
        if (!preg_match('/\A([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\z/', $clean, $matches)) {
            return null;
        }

        return $matches[1] . ':' . $matches[2];
    }

    private function toMinutes(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));

        return ($h * 60) + $m;
    }
}
