describe('Teste básico (e2e)', () => {
  it('deve somar dois números corretamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('deve retornar verdadeiro para true', () => {
    expect(true).toBeTruthy();
  });

  it('deve validar operações matemáticas básicas', () => {
    expect(2 * 3).toBe(6);
    expect(10 - 5).toBe(5);
    expect(15 / 3).toBe(5);
  });

  it('deve validar strings', () => {
    expect('hello').toBe('hello');
    expect('test').toContain('es');
  });

  it('deve validar arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
