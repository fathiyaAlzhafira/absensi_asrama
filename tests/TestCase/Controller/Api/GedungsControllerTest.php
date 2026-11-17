<?php
declare(strict_types=1);

namespace App\Test\TestCase\Controller\Api;

use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

class GedungsControllerTest extends TestCase
{
    use IntegrationTestTrait;

    public function testBuildingListRequiresAuthentication(): void
    {
        $this->get('/api/gedungs');

        $this->assertResponseCode(401);
    }

    public function testUnsignedBearerTokenDoesNotAuthenticate(): void
    {
        $this->configRequest([
            'headers' => ['Authorization' => 'Bearer ' . base64_encode('4:user@example.test:1')],
        ]);
        $this->get('/api/gedungs');

        $this->assertResponseCode(401);
    }

    public function testExpiredBearerTokenDoesNotAuthenticate(): void
    {
        $users = $this->fetchTable('Users');
        [$user, $token] = $this->createResidentWithToken($users, 'penghuni', '-1 hour');

        $this->configRequest(['headers' => ['Authorization' => 'Bearer ' . $token]]);
        $this->get('/api/presensis/my-history');

        $this->assertResponseCode(401);
        $this->fetchTable('AuthTokens')->deleteAll(['user_id' => $user->id]);
        $users->delete($user);
    }

    public function testAuthenticatedNonAdminCannotCreateBuildings(): void
    {
        $users = $this->fetchTable('Users');
        [$user, $token] = $this->createResidentWithToken($users);

        $this->configRequest(['headers' => ['Authorization' => 'Bearer ' . $token]]);
        $this->post('/api/gedungs', []);

        $this->assertResponseCode(403);
        $this->fetchTable('AuthTokens')->deleteAll(['user_id' => $user->id]);
        $users->delete($user);
    }

    public function testAttendanceRejectsResidentWithoutAssignment(): void
    {
        $users = $this->fetchTable('Users');
        [$user, $token] = $this->createResidentWithToken($users);

        $this->configRequest(['headers' => ['Authorization' => 'Bearer ' . $token]]);
        $this->post('/api/presensis', []);

        $this->assertResponseCode(422);
        $this->fetchTable('AuthTokens')->deleteAll(['user_id' => $user->id]);
        $users->delete($user);
    }

    public function testAttendanceRejectsInactiveAssignedBuilding(): void
    {
        $users = $this->fetchTable('Users');
        [$user, $token] = $this->createResidentWithToken($users);
        $buildings = $this->fetchTable('Gedungs');
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $building = $buildings->newEntity([
            'nama' => 'Inactive test building',
            'radius_meter' => 100,
            'geofence_geojson' => json_encode([
                'type' => 'Polygon',
                'coordinates' => [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            ]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $building->is_active = false;
        self::assertNotFalse($buildings->save($building));

        $rooms = $this->fetchTable('Kamars');
        $room = $rooms->newEntity([
            'gedung_id' => $building->id,
            'nomor_kamar' => 'T-1',
            'lantai' => 1,
            'kapasitas' => 4,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        self::assertNotFalse($rooms->save($room));
        $user->kamar_id = $room->id;
        self::assertNotFalse($users->save($user));

        $this->configRequest(['headers' => ['Authorization' => 'Bearer ' . $token]]);
        $this->post('/api/presensis', []);

        $this->assertResponseCode(422);
        $this->fetchTable('AuthTokens')->deleteAll(['user_id' => $user->id]);
        $users->delete($user);
        $rooms->delete($room);
        $buildings->delete($building);
    }

    public function testAdminCanCreateUpdateDeactivateAndDeleteEmptyBuilding(): void
    {
        $users = $this->fetchTable('Users');
        [$admin, $token] = $this->createResidentWithToken($users, 'admin');
        $this->authorize($token);
        $geometry = [
            'type' => 'Polygon',
            'coordinates' => [[[100.45, -0.92], [100.46, -0.92], [100.46, -0.91], [100.45, -0.91], [100.45, -0.92]]],
        ];

        $this->post('/api/gedungs', [
            'nama' => 'CRUD test building',
            'geofence_geojson' => $geometry,
            'is_active' => true,
        ]);
        $this->assertResponseCode(201);
        $created = json_decode((string)$this->_response->getBody(), true);
        $buildingId = $created['data']['id'];
        self::assertSame($geometry, $created['data']['geofence_geojson']);

        $this->authorize($token);
        $this->put('/api/gedungs/' . $buildingId, [
            'nama' => 'Updated test building',
            'geofence_geojson' => $geometry,
        ]);
        $this->assertResponseCode(200);
        $updated = json_decode((string)$this->_response->getBody(), true);
        self::assertSame('Updated test building', $updated['data']['nama']);

        $this->authorize($token);
        $this->patch('/api/gedungs/' . $buildingId . '/status', ['is_active' => false]);
        $this->assertResponseCode(200);
        $inactive = json_decode((string)$this->_response->getBody(), true);
        self::assertFalse($inactive['data']['is_active']);

        $this->authorize($token);
        $this->delete('/api/gedungs/' . $buildingId);
        $this->assertResponseCode(200);
        $users->delete($admin);
    }

    public function testAdminCanManageRoomsLinkedToBuilding(): void
    {
        $users = $this->fetchTable('Users');
        [$admin, $token] = $this->createResidentWithToken($users, 'admin');
        $this->authorize($token);
        $geometry = [
            'type' => 'Polygon',
            'coordinates' => [[[100.45, -0.92], [100.46, -0.92], [100.46, -0.91], [100.45, -0.91], [100.45, -0.92]]],
        ];
        $this->post('/api/gedungs', [
            'nama' => 'Room test building',
            'geofence_geojson' => $geometry,
            'jumlah_lantai' => 2,
            'is_active' => true,
        ]);
        $this->assertResponseCode(201);
        $createdBuilding = json_decode((string)$this->_response->getBody(), true)['data'];
        $buildingId = $createdBuilding['id'];
        self::assertSame(2, $createdBuilding['jumlah_lantai']);

        $this->authorize($token);
        $this->post('/api/lantais', [
            'gedung_id' => $buildingId,
            'nomor_lantai' => 3,
            'nama' => 'Sayap Timur',
        ]);
        $this->assertResponseCode(201);
        $floor3 = json_decode((string)$this->_response->getBody(), true)['data'];
        self::assertSame(3, $floor3['nomor_lantai']);

        $this->authorize($token);
        $this->post('/api/kamars', [
            'gedung_id' => $buildingId,
            'nomor_kamar' => 'R-101',
            'lantai' => 1,
            'kapasitas' => 4,
        ]);
        $this->assertResponseCode(201);
        $room = json_decode((string)$this->_response->getBody(), true)['data'];
        self::assertSame($buildingId, $room['gedung_id']);
        self::assertSame('Room test building', $room['gedung_nama']);

        $this->authorize($token);
        $this->put('/api/kamars/' . $room['id'], [
            'gedung_id' => $buildingId,
            'nomor_kamar' => 'R-401',
            'lantai' => 4,
            'kapasitas' => 3,
        ]);
        $this->assertResponseCode(200);
        $updatedRoom = json_decode((string)$this->_response->getBody(), true)['data'];
        self::assertSame('R-401', $updatedRoom['nomor_kamar']);
        self::assertSame(4, $updatedRoom['lantai']);
        self::assertTrue($this->fetchTable('Lantais')->exists([
            'gedung_id' => $buildingId,
            'nomor_lantai' => 4,
        ]));

        $this->authorize($token);
        $this->delete('/api/lantais/' . $floor3['id']);
        $this->assertResponseCode(200);

        $this->authorize($token);
        $this->delete('/api/kamars/' . $room['id']);
        $this->assertResponseCode(200);
        $this->authorize($token);
        $this->delete('/api/gedungs/' . $buildingId);
        $this->assertResponseCode(200);
        $users->delete($admin);
    }

    /**
     * @param \App\Model\Table\UsersTable $users
     * @return array{0: \App\Model\Entity\User, 1: string}
     */
    private function createResidentWithToken($users, string $role = 'penghuni', string $expiry = '+1 hour'): array
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $user = $users->newEntity([
            'nama' => 'Resident Test',
            'nim' => 'RT-' . bin2hex(random_bytes(5)),
            'jekel' => 'L',
            'email' => bin2hex(random_bytes(5)) . '@example.test',
            'password' => password_hash('test-password', PASSWORD_DEFAULT),
            'role' => $role,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        self::assertNotFalse($users->save($user));

        $token = bin2hex(random_bytes(32));
        $tokenRecord = $this->fetchTable('AuthTokens')->newEntity([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => (new \DateTimeImmutable($expiry))->format('Y-m-d H:i:s'),
            'created_at' => $now,
        ]);
        self::assertNotFalse($this->fetchTable('AuthTokens')->save($tokenRecord));

        return [$user, $token];
    }

    private function authorize(string $token): void
    {
        $this->configRequest(['headers' => ['Authorization' => 'Bearer ' . $token]]);
    }
}
