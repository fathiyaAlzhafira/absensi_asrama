<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * PengaturanPresensi Model
 *
 * @method \App\Model\Entity\PengaturanPresensi newEmptyEntity()
 * @method \App\Model\Entity\PengaturanPresensi newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\PengaturanPresensi> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\PengaturanPresensi get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\PengaturanPresensi findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\PengaturanPresensi patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\PengaturanPresensi> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\PengaturanPresensi|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\PengaturanPresensi saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\PengaturanPresensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PengaturanPresensi>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PengaturanPresensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PengaturanPresensi> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PengaturanPresensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PengaturanPresensi>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\PengaturanPresensi>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\PengaturanPresensi> deleteManyOrFail(iterable $entities, array $options = [])
 */
class PengaturanPresensiTable extends Table
{
    /**
     * Initialize method
     *
     * @param array<string, mixed> $config The configuration for the Table.
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);

        $this->setTable('pengaturan_presensi');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');
    }

    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->time('jam_subuh_mulai')
            ->notEmptyTime('jam_subuh_mulai');

        $validator
            ->time('jam_subuh_selesai')
            ->notEmptyTime('jam_subuh_selesai');

        $validator
            ->time('jam_malam_mulai')
            ->notEmptyTime('jam_malam_mulai');

        $validator
            ->time('jam_malam_selesai')
            ->notEmptyTime('jam_malam_selesai');

        $validator
            ->decimal('lat_default')
            ->notEmptyString('lat_default');

        $validator
            ->decimal('long_default')
            ->notEmptyString('long_default');

        $validator
            ->nonNegativeInteger('radius_default_meter')
            ->notEmptyString('radius_default_meter');

        $validator
            ->dateTime('created_at')
            ->allowEmptyDateTime('created_at');

        $validator
            ->dateTime('updated_at')
            ->allowEmptyDateTime('updated_at');

        return $validator;
    }
}
