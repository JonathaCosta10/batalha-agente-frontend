"""Illustrative labels only. Never inputs to segmentation, eligibility or advice."""
FIRST=('Marina','Lucas','Camila','Pedro','Beatriz','Bruno','Juliana','Gabriel','Larissa','Felipe','Amanda','Diego','Renata','Gustavo','Carolina','André','Fernanda','Rafael','Patrícia','Daniel')
LAST=('Alves','Andrade','Araújo','Barbosa','Barros','Batista','Borges','Campos','Cardoso','Carvalho','Castro','Cavalcanti','Coelho','Correia','Costa','Cunha','Dias','Duarte','Farias','Fernandes','Ferreira','Figueiredo','Freitas','Gomes','Gonçalves','Guimarães','Lima','Lopes','Macedo','Machado','Marques','Martins','Medeiros','Melo','Mendes','Moreira','Moura','Nascimento','Nogueira','Oliveira','Pereira','Pinto','Ramos','Reis','Ribeiro','Rocha','Santana','Santos','Silva','Teixeira')
def demo_name(index):
    if type(index)!=int or not 1<=index<=len(FIRST)*len(LAST):raise ValueError('Índice de demonstração inválido.')
    i=index-1
    return FIRST[i%len(FIRST)]+' '+LAST[i//len(FIRST)]
