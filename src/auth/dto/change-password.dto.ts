import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { MatchProperty } from "src/utils/validators/match-property.constraint";

export class ChangePasswordDto {
    @IsNotEmpty({ message: 'A senha atual é obrigatória.'})
    @IsString()
    senhaAtual: string;

    @IsNotEmpty({ message: 'A nova senha é obrigatória.'})
    @IsString()
    @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' })
    novaSenha: string;

    @IsNotEmpty({ message: 'A confirmação da nova senha é obrigatória.' })
    @IsString()
    @MatchProperty('novaSenha', { message: 'A nova senha e a confirmação não conferem.' })
    confirmarNovaSenha: string;
}
