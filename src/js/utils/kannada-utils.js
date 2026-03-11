export const kannadaDigits = ['೦','೧','೨','೩','೪','೫','೬','೭','೮','೯'];

export function toKannadaNum(num) {
    const numStr = num.toString().padStart(2, '0');
    return numStr.split('').map(digit => kannadaDigits[parseInt(digit)]).join('');
}
