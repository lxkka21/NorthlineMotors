import { supabase } from '../lib/supabase.js';

const confirmation = 'I_UNDERSTAND_DEMO_DATABASE';
const demoTarget = 'demo';

type DemoVehicle = {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity_in_stock: number;
};

const demoVehicles: DemoVehicle[] = [
  { id: '10000000-0000-4000-8000-000000000001', make: 'Toyota', model: 'Camry XSE', category: 'Sedan', price: 32995, quantity_in_stock: 4 },
  { id: '10000000-0000-4000-8000-000000000002', make: 'Honda', model: 'CR-V Touring', category: 'SUV', price: 38990, quantity_in_stock: 3 },
  { id: '10000000-0000-4000-8000-000000000003', make: 'Ford', model: 'F-150 Lariat', category: 'Truck', price: 57900, quantity_in_stock: 2 },
  { id: '10000000-0000-4000-8000-000000000004', make: 'Tesla', model: 'Model 3 Long Range', category: 'Electric', price: 44990, quantity_in_stock: 5 },
  { id: '10000000-0000-4000-8000-000000000005', make: 'BMW', model: '330i xDrive', category: 'Luxury Sedan', price: 52750, quantity_in_stock: 1 },
  { id: '10000000-0000-4000-8000-000000000006', make: 'Subaru', model: 'Outback Wilderness', category: 'Wagon', price: 36995, quantity_in_stock: 3 },
  { id: '10000000-0000-4000-8000-000000000007', make: 'Mazda', model: 'CX-5 Carbon Edition', category: 'SUV', price: 31420, quantity_in_stock: 6 },
  { id: '10000000-0000-4000-8000-000000000008', make: 'Chevrolet', model: 'Silverado 1500 LT', category: 'Truck', price: 48200, quantity_in_stock: 2 },
  { id: '10000000-0000-4000-8000-000000000009', make: 'Kia', model: 'Telluride SX', category: 'SUV', price: 47290, quantity_in_stock: 4 },
  { id: '10000000-0000-4000-8000-000000000010', make: 'Hyundai', model: 'Ioniq 5 Limited', category: 'Electric', price: 54100, quantity_in_stock: 2 },
  { id: '10000000-0000-4000-8000-000000000011', make: 'Volkswagen', model: 'Jetta Sport', category: 'Sedan', price: 24990, quantity_in_stock: 7 },
  { id: '10000000-0000-4000-8000-000000000012', make: 'Jeep', model: 'Wrangler Sahara', category: '4x4', price: 45995, quantity_in_stock: 2 },
  { id: '10000000-0000-4000-8000-000000000013', make: 'Audi', model: 'Q5 Premium Plus', category: 'Luxury SUV', price: 58900, quantity_in_stock: 1 },
  { id: '10000000-0000-4000-8000-000000000014', make: 'Nissan', model: 'Leaf SV Plus', category: 'Electric', price: 36500, quantity_in_stock: 0 },
  { id: '10000000-0000-4000-8000-000000000015', make: 'Lexus', model: 'RX 350h', category: 'Hybrid SUV', price: 61200, quantity_in_stock: 2 },
];

function configuredHost() {
  return new URL(process.env.SUPABASE_URL ?? '').hostname;
}

async function main() {
  const host = configuredHost();
  if (!host.endsWith('.supabase.co')) throw new Error('SUPABASE_URL does not target a Supabase project');

  console.log(`Demo seed target: ${host}`);
  console.log(`Planned inserts: ${demoVehicles.length} fixed-ID vehicles; existing IDs will be left unchanged.`);

  if (process.env.SUPABASE_DATABASE_TARGET?.toLowerCase() !== demoTarget) {
    throw new Error('No records were inserted. Set SUPABASE_DATABASE_TARGET=demo only after configuring a dedicated demo Supabase project.');
  }

  if (process.env.SEED_CONFIRM !== confirmation) {
    throw new Error(`No records were inserted. Set SEED_CONFIRM=${confirmation} only after confirming this is the intended demo database.`);
  }

  const ids = demoVehicles.map((vehicle) => vehicle.id);
  const { data: existing, error: lookupError } = await supabase.from('vehicles').select('id').in('id', ids);
  if (lookupError) throw lookupError;

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  const missing = demoVehicles.filter((vehicle) => !existingIds.has(vehicle.id));
  if (missing.length > 0) {
    const { error } = await supabase.from('vehicles').insert(missing);
    if (error) throw error;
  }

  const { data: verified, error: verifyError } = await supabase.from('vehicles').select('id').in('id', ids);
  if (verifyError) throw verifyError;
  const verifiedIds = new Set((verified ?? []).map((row) => row.id as string));
  if (verifiedIds.size !== demoVehicles.length) throw new Error('Demo seed verification found an incomplete record set');

  console.log(`Seed complete: inserted ${missing.length}, left unchanged ${demoVehicles.length - missing.length}, verified ${verifiedIds.size}.`);
}

main().catch((error: unknown) => {
  const safe = error instanceof Error ? error.message : 'Unknown seed failure';
  console.error(`Demo seed failed: ${safe}`);
  process.exitCode = 1;
});
