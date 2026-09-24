<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query\SelectQuery;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Gedungs Model
 *
 * @property \App\Model\Table\KamarsTable&\Cake\ORM\Association\HasMany $Kamars
 *
 * @method \App\Model\Entity\Gedung newEmptyEntity()
 * @method \App\Model\Entity\Gedung newEntity(array $data, array $options = [])
 * @method array<\App\Model\Entity\Gedung> newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Gedung get(mixed $primaryKey, array|string $finder = 'all', \Psr\SimpleCache\CacheInterface|string|null $cache = null, \Closure|string|null $cacheKey = null, mixed ...$args)
 * @method \App\Model\Entity\Gedung findOrCreate($search, ?callable $callback = null, array $options = [])
 * @method \App\Model\Entity\Gedung patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method array<\App\Model\Entity\Gedung> patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\Gedung|false save(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method \App\Model\Entity\Gedung saveOrFail(\Cake\Datasource\EntityInterface $entity, array $options = [])
 * @method iterable<\App\Model\Entity\Gedung>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Gedung>|false saveMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Gedung>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Gedung> saveManyOrFail(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Gedung>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Gedung>|false deleteMany(iterable $entities, array $options = [])
 * @method iterable<\App\Model\Entity\Gedung>|\Cake\Datasource\ResultSetInterface<\App\Model\Entity\Gedung> deleteManyOrFail(iterable $entities, array $options = [])
 */
class GedungsTable extends Table
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

        $this->setTable('gedungs');
        $this->setDisplayField('nama');
        $this->setPrimaryKey('id');

        $this->hasMany('Kamars', [
            'foreignKey' => 'gedung_id',
        ]);
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
            ->scalar('nama')
            ->maxLength('nama', 100)
            ->requirePresence('nama', 'create')
            ->notEmptyString('nama');

        $validator
            ->nonNegativeInteger('id_user')
            ->allowEmptyString('id_user');

        $validator
            ->decimal('latitude')
            ->allowEmptyString('latitude');

        $validator
            ->decimal('longitude')
            ->allowEmptyString('longitude');

        $validator
            ->nonNegativeInteger('radius_meter')
            ->notEmptyString('radius_meter');

        $validator
            ->scalar('keterangan')
            ->allowEmptyString('keterangan');

        $validator
            ->dateTime('created_at')
            ->allowEmptyDateTime('created_at');

        $validator
            ->dateTime('updated_at')
            ->allowEmptyDateTime('updated_at');

        return $validator;
    }
}
