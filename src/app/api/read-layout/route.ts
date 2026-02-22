import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function toPascalCase(role: string): string {
  return role
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'role est requis' }, { status: 400 });
    }

    const pascalName = toPascalCase(role);
    const componentName = `Layout${pascalName}`;
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(process.cwd(), 'src', 'components', 'layouts', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Layout non trouvé' }, { status: 404 });
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ role, code, componentName });
  } catch (err) {
    console.error('[read-layout] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}
