import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.response.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.jurorTag.deleteMany({});
  await prisma.batsonChallenge.deleteMany({});
  await prisma.juror.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'prosecutor@texas.gov',
      password: hashedPassword,
      name: 'John Smith',
    },
  });

  console.log('✓ Created test user:', user.email);

  // Create a sample case with new fields
  const testCase = await prisma.case.create({
    data: {
      name: 'State v. Johnson',
      causeNumber: '2024-CV-001234',
      defendantName: 'Marcus Johnson',
      offenseType: 'Aggravated Assault',
      date: new Date('2026-03-15'),
      jurySize: 12,
      numAlternates: 4,
      stateStrikes: 10,
      defenseStrikes: 10,
      stateAltStrikes: 2,
      defenseAltStrikes: 2,
      userId: user.id,
    },
  });

  console.log('✓ Created test case:', testCase.name);

  // Create sample jurors with new schema (36 total: 32 regular + 4 alternates)
  const jurorData = [
    { firstName: 'Sarah', lastName: 'Martinez', age: 34, gender: 'Female', occupation: 'Teacher', employer: 'Austin ISD', educationLevel: "Master's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78701' },
    { firstName: 'Michael', lastName: 'Chen', age: 45, gender: 'Male', occupation: 'Software Engineer', employer: 'Tech Corp', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78759' },
    { firstName: 'James', lastName: 'Williams', age: 28, gender: 'Male', occupation: 'Mechanic', employer: 'Austin Auto Repair', educationLevel: 'High School Diploma', maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78744' },
    { firstName: 'Patricia', lastName: 'Thompson', age: 52, gender: 'Female', occupation: 'Nurse', employer: 'St. David\'s Hospital', educationLevel: "Bachelor's Degree", maritalStatus: 'Divorced', numberOfChildren: 2, city: 'Austin', zipCode: '78745' },
    { firstName: 'Robert', lastName: 'Anderson', age: 61, gender: 'Male', occupation: 'Retired Police Officer', employer: 'Retired', educationLevel: 'Some College', maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78731' },
    { firstName: 'Lisa', lastName: 'Rodriguez', age: 38, gender: 'Female', occupation: 'Attorney', employer: 'Private Practice', educationLevel: 'Juris Doctor', maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78703' },
    { firstName: 'David', lastName: 'Johnson', age: 42, gender: 'Male', occupation: 'Construction Worker', employer: 'ABC Construction', educationLevel: 'High School Diploma', maritalStatus: 'Married', numberOfChildren: 4, city: 'Austin', zipCode: '78753' },
    { firstName: 'Jennifer', lastName: 'Lee', age: 29, gender: 'Female', occupation: 'Social Worker', employer: 'Travis County', educationLevel: "Master's Degree", maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78704' },
    { firstName: 'Christopher', lastName: 'Davis', age: 55, gender: 'Male', occupation: 'Accountant', employer: 'Self-Employed', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78746' },
    { firstName: 'Angela', lastName: 'Brown', age: 47, gender: 'Female', occupation: 'Real Estate Agent', employer: 'Keller Williams', educationLevel: "Bachelor's Degree", maritalStatus: 'Divorced', numberOfChildren: 1, city: 'Austin', zipCode: '78752' },
    { firstName: 'Thomas', lastName: 'Wilson', age: 33, gender: 'Male', occupation: 'Restaurant Manager', employer: 'Local Restaurant', educationLevel: 'Some College', maritalStatus: 'Single', numberOfChildren: 1, city: 'Austin', zipCode: '78758' },
    { firstName: 'Mary', lastName: 'Garcia', age: 39, gender: 'Female', occupation: 'Librarian', employer: 'Austin Public Library', educationLevel: "Master's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78702' },
    { firstName: 'Kevin', lastName: 'Taylor', age: 35, gender: 'Male', occupation: 'Salesman', employer: 'Tech Sales Inc', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 1, city: 'Round Rock', zipCode: '78681' },
    { firstName: 'Michelle', lastName: 'Jackson', age: 31, gender: 'Female', occupation: 'Marketing Manager', employer: 'Marketing Co', educationLevel: "Bachelor's Degree", maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78757' },
    { firstName: 'Daniel', lastName: 'White', age: 36, gender: 'Male', occupation: 'Electrician', employer: 'Power Plus', educationLevel: 'Trade School', maritalStatus: 'Married', numberOfChildren: 1, city: 'Austin', zipCode: '78701' },
    { firstName: 'Elizabeth', lastName: 'Harris', age: 44, gender: 'Female', occupation: 'Doctor', employer: 'UT Medical', educationLevel: 'Doctorate', maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78702' },
    { firstName: 'Joseph', lastName: 'Clark', age: 51, gender: 'Male', occupation: 'Business Owner', employer: 'Clark & Co', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78703' },
    { firstName: 'Linda', lastName: 'Lewis', age: 40, gender: 'Female', occupation: 'Social Worker', employer: 'Child Services', educationLevel: "Master's Degree", maritalStatus: 'Single', numberOfChildren: 1, city: 'Austin', zipCode: '78704' },
    { firstName: 'Richard', lastName: 'Walker', age: 58, gender: 'Male', occupation: 'Retired Firefighter', employer: 'Retired', educationLevel: 'Some College', maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78705' },
    { firstName: 'Barbara', lastName: 'Hall', age: 46, gender: 'Female', occupation: 'Banker', employer: 'FirstBank', educationLevel: "Bachelor's Degree", maritalStatus: 'Divorced', numberOfChildren: 2, city: 'Austin', zipCode: '78706' },
    { firstName: 'William', lastName: 'Allen', age: 48, gender: 'Male', occupation: 'Insurance Agent', employer: 'State Farm', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78707' },
    { firstName: 'Nancy', lastName: 'Young', age: 43, gender: 'Female', occupation: 'Graphic Designer', employer: 'Creative Studio', educationLevel: "Bachelor's Degree", maritalStatus: 'Single', numberOfChildren: 1, city: 'Austin', zipCode: '78708' },
    { firstName: 'Charles', lastName: 'Scott', age: 54, gender: 'Male', occupation: 'Principal', employer: 'Austin ISD', educationLevel: "Master's Degree", maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78709' },
    { firstName: 'Susan', lastName: 'Green', age: 37, gender: 'Female', occupation: 'Engineer', employer: 'Tech Solutions', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 1, city: 'Austin', zipCode: '78710' },
    { firstName: 'Paul', lastName: 'Adams', age: 47, gender: 'Male', occupation: 'Lawyer', employer: 'Law Firm', educationLevel: 'Juris Doctor', maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78711' },
    { firstName: 'Jessica', lastName: 'Nelson', age: 32, gender: 'Female', occupation: 'Nurse Practitioner', employer: 'Hospital System', educationLevel: "Master's Degree", maritalStatus: 'Married', numberOfChildren: 1, city: 'Austin', zipCode: '78712' },
    { firstName: 'Mark', lastName: 'Baker', age: 50, gender: 'Male', occupation: 'Plumber', employer: 'ABC Plumbing', educationLevel: 'Trade School', maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78713' },
    { firstName: 'Karen', lastName: 'Phillips', age: 41, gender: 'Female', occupation: 'Accountant', employer: 'Accounting Firm', educationLevel: "Bachelor's Degree", maritalStatus: 'Single', numberOfChildren: 1, city: 'Austin', zipCode: '78714' },
    { firstName: 'Steven', lastName: 'Campbell', age: 53, gender: 'Male', occupation: 'Manager', employer: 'Tech Company', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78715' },
    { firstName: 'Donna', lastName: 'Parker', age: 39, gender: 'Female', occupation: 'Consultant', employer: 'Consulting Firm', educationLevel: "Master's Degree", maritalStatus: 'Single', numberOfChildren: 0, city: 'Austin', zipCode: '78716' },
    { firstName: 'Andrew', lastName: 'Evans', age: 44, gender: 'Male', occupation: 'Contractor', employer: 'Self-Employed', educationLevel: 'High School Diploma', maritalStatus: 'Married', numberOfChildren: 4, city: 'Austin', zipCode: '78717' },
    { firstName: 'Carol', lastName: 'Edwards', age: 49, gender: 'Female', occupation: 'Teacher', employer: 'Austin ISD', educationLevel: "Master's Degree", maritalStatus: 'Married', numberOfChildren: 2, city: 'Austin', zipCode: '78718' },
    { firstName: 'George', lastName: 'Collins', age: 56, gender: 'Male', occupation: 'Veteran', employer: 'Retired', educationLevel: 'High School Diploma', maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78719' },
    { firstName: 'Sandra', lastName: 'Stewart', age: 35, gender: 'Female', occupation: 'Pharmacist', employer: 'Pharmacy Chain', educationLevel: 'Doctorate', maritalStatus: 'Married', numberOfChildren: 1, city: 'Austin', zipCode: '78720' },
    { firstName: 'Edward', lastName: 'Morris', age: 59, gender: 'Male', occupation: 'Supervisor', employer: 'Manufacturing', educationLevel: "Bachelor's Degree", maritalStatus: 'Married', numberOfChildren: 3, city: 'Austin', zipCode: '78721' },
    { firstName: 'Cynthia', lastName: 'Rogers', age: 38, gender: 'Female', occupation: 'Manager', employer: 'Retail Store', educationLevel: "Bachelor's Degree", maritalStatus: 'Single', numberOfChildren: 2, city: 'Austin', zipCode: '78722' },
  ];

  const jurorTags = ['Favorable', 'Favorable', 'Favorable', 'Favorable', 'Favorable', 'Unfavorable', 'Neutral', 'Neutral', 'Favorable', 'Neutral', 'Neutral', 'Favorable', 'Neutral', 'Favorable', 'Neutral', 'Favorable', 'Favorable', 'Neutral', 'Unfavorable', 'Neutral', 'Favorable', 'Favorable', 'Neutral', 'Neutral', 'Favorable', 'Favorable', 'Unfavorable', 'Neutral', 'Favorable', 'Favorable', 'Neutral', 'Neutral', 'Favorable', 'Neutral', 'Neutral', 'Favorable'];

  for (let i = 0; i < jurorData.length; i++) {
    const juror = await prisma.juror.create({
      data: {
        ...jurorData[i],
        caseId: testCase.id,
        jurorNumber: i + 1,
        seatNumber: i + 1,
        panelType: i < 32 ? 'REGULAR' : 'ALTERNATE',
        overallScore: Math.floor(Math.random() * 3) + 2,
        forCause: false,
        isStruck: false,
        status: 'ACTIVE',
      },
    });
    console.log(`✓ Created juror ${i + 1}: ${juror.firstName} ${juror.lastName}`);

    // Add tag
    await prisma.jurorTag.create({
      data: {
        jurorId: juror.id,
        tag: jurorTags[i],
      },
    });

    // Add sample notes for some jurors
    if (i === 0) {
      await prisma.note.create({
        data: {
          jurorId: juror.id,
          content: 'Very attentive during questioning. Made excellent eye contact.',
        },
      });
    }
    if (i === 5) {
      await prisma.note.create({
        data: {
          jurorId: juror.id,
          content: 'Attorney. May have strong opinions about criminal procedure.',
        },
      });
      await prisma.note.create({
        data: {
          jurorId: juror.id,
          content: 'Expressed skepticism about eyewitness testimony.',
        },
      });
    }
    if (i === 4) {
      await prisma.note.create({
        data: {
          jurorId: juror.id,
          content: 'Former law enforcement. Strong pro-prosecution bias likely.',
        },
      });
    }
  }

  // Create sample questions for the case
  const questions = [
    { text: 'Do you have any experience with the criminal justice system?', type: 'OPEN_ENDED' as const, category: 'Background' },
    { text: 'Rate your confidence in law enforcement (1-5)', type: 'SCALED' as const, scaleMax: 5, category: 'Bias' },
    { text: 'Have you or a family member been accused of a crime?', type: 'OPEN_ENDED' as const, category: 'Background' },
    { text: 'Rate your belief that eyewitness testimony is reliable (1-5)', type: 'SCALED' as const, scaleMax: 5, category: 'Evidence' },
    { text: 'Do you believe in self-defense rights?', type: 'OPEN_ENDED' as const, category: 'Bias' },
  ];

  for (let i = 0; i < questions.length; i++) {
    await prisma.question.create({
      data: {
        ...questions[i],
        caseId: testCase.id,
        sortOrder: i,
      },
    });
  }

  console.log(`✓ Created ${questions.length} sample questions`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log('   Email: prosecutor@texas.gov');
  console.log('   Password: password123');
  console.log(`   Case: ${testCase.name}`);
  console.log(`   Cause Number: ${testCase.causeNumber}`);
  console.log(`   Defendant: ${testCase.defendantName}`);
  console.log(`   Jurors: 36 (32 regular, 4 alternates)`);
  console.log(`   Questions: ${questions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
