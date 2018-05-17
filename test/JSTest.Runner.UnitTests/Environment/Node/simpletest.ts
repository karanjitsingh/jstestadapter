describe('c', () => {
    it('a', (done) => {
        console.error('yo');
        setTimeout(() => {
            console.log('go');
        }, 5000);
        setTimeout(() => { done(); }, 3000);
    });

    it('b', (done) => {
        console.log('gg');
        done();
    });
});