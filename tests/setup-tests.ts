import GlobalCacher from '../index';

beforeEach(() => {
    GlobalCacher.clear();
})

afterAll(() => {
    GlobalCacher.dispose()
})

