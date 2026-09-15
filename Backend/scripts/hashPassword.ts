import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: tsx scripts/hashPassword.ts <password>');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
});