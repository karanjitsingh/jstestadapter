import * as OS from 'os';
import { IEnvironment } from '../../../src/JSTest.Runner/Environment/IEnvironment';

export const defaultTestEnvironment = { getTempDirectory: () => OS.tmpdir() } as IEnvironment;
