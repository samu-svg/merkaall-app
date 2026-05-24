-- Normaliza categorias do Mercado Livre para a taxonomia do app.
-- Execute no Supabase SQL Editor ou via migration.

UPDATE promocoes SET categoria = 'Tecnologia'
WHERE categoria IN ('Eletrônicos, Áudio e Vídeo', 'Informática', 'Celulares e Telefones', 'Games');

UPDATE promocoes SET categoria = 'Esportes'
WHERE categoria = 'Esportes e Fitness';

UPDATE promocoes SET categoria = 'Roupas e Moda'
WHERE categoria IN ('Calçados, Roupas e Bolsas', 'Joias e Relógios');

UPDATE promocoes SET categoria = 'Casa e Decoração'
WHERE categoria IN ('Casa, Móveis e Decoração', 'Construção', 'Indústria e Comércio');

UPDATE promocoes SET categoria = 'Beleza'
WHERE categoria = 'Beleza e Cuidado Pessoal';

UPDATE promocoes SET categoria = 'Brinquedos'
WHERE categoria = 'Brinquedos e Hobbies';

UPDATE promocoes SET categoria = 'Livros'
WHERE categoria = 'Livros, Revistas e Comics';

UPDATE promocoes SET categoria = 'Automotivo'
WHERE categoria = 'Acessórios para Veículos';

UPDATE promocoes SET categoria = 'Alimentos'
WHERE categoria IN ('Agro', 'Alimentos e Bebidas');

UPDATE promocoes SET categoria = 'Pets'
WHERE categoria = 'Pet Shop';

UPDATE promocoes SET categoria = 'Saúde'
WHERE categoria IN ('Saúde', 'Saúde e Bem-Estar', 'Farmácia');

UPDATE promocoes SET categoria = 'Papelaria'
WHERE categoria = 'Arte, Papelaria e Armarinho';

UPDATE promocoes SET categoria = 'Bebês'
WHERE categoria = 'Bebês';

UPDATE promocoes SET categoria = 'Ferramentas'
WHERE categoria = 'Ferramentas';
