
<?php
/**
 * Plugin configuration.
 *
 * CakePHP(tm) : Rapid Development Framework
 * https://cakephp.org
 */

return [
    // DebugKit dinonaktifkan sementara karena pdo_sqlite belum aktif.
    // 'DebugKit' => ['onlyDebug' => true],

    // Bake tetap tersedia untuk kebutuhan CLI.
    'Bake' => [
        'onlyCli' => true,
        'optional' => true,
    ],

    // Migrations tetap tersedia untuk kebutuhan CLI.
    'Migrations' => [
        'onlyCli' => true,
    ],

    // Additional plugins here
];
