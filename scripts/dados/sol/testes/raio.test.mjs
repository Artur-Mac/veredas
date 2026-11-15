// A cópia de intervalosDoRaio reproduz os casos do app (tests/sol-janelas.test.ts): fora, furo, origem dentro.
import { test } from "node:test";
import assert from "node:assert/strict";
import { intervalosDoRaio } from "../raio.mjs";

const q = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
test("raio atravessa um quadrado à frente", () => assert.deepEqual(intervalosDoRaio([0, 0], [1, 0], [q(10, -5, 20, 5)]), [[10, 20]]));
test("raio para trás não pega o quadrado", () => assert.deepEqual(intervalosDoRaio([0, 0], [-1, 0], [q(10, -5, 20, 5)]), []));
test("furo divide o intervalo", () => assert.deepEqual(intervalosDoRaio([0, 0], [1, 0], [q(10, -5, 30, 5), q(15, -2, 25, 2)]), [[10, 15], [25, 30]]));
test("origem dentro do volume começa em 0", () => assert.deepEqual(intervalosDoRaio([12, 0], [1, 0], [q(10, -5, 20, 5)]), [[0, 8]]));
