
import * as admin from 'firebase-admin';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const db = admin.firestore();

interface DailyReport {
  date: string;
  collectedToday: number;
  expectedToday: number;
}

/**
 * The core logic for generating the daily collection report.
 * This function is designed to be called internally by a Cloud Function wrapper.
 * @param numberOfDays The number of days to generate the report for, counting back from today.
 * @returns A promise that resolves to an array of daily report data.
 */
export async function generateDailyCollectionReport(numberOfDays: number): Promise<DailyReport[]> {
  const reportData: DailyReport[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < numberOfDays; i++) {
    const targetDate = subDays(today, i);
    const dateKey = format(targetDate, 'yyyy-MM-dd');
    let collectedToday = 0;
    let expectedToday = 0;

    const startOfDayTimestamp = admin.firestore.Timestamp.fromDate(startOfDay(targetDate));
    const endOfDayTimestamp = admin.firestore.Timestamp.fromDate(endOfDay(targetDate));

    try {
      // 1. Calculate EXPECTED amount by querying the pre-computed schedules.
      const scheduleSnapshot = await db.collectionGroup('scheduledPayments')
        .where('dueDate', '>=', startOfDayTimestamp)
        .where('dueDate', '<=', endOfDayTimestamp)
        .get();
        
      scheduleSnapshot.forEach(doc => {
        const schedule = doc.data();
        if (schedule && typeof schedule.expectedAmount === 'number') {
          expectedToday += schedule.expectedAmount;
        }
      });

      // 2. Calculate COLLECTED amount by querying the actual payment records.
      const paymentsSnapshot = await db.collectionGroup('payments')
        .where('collectionDate', '>=', startOfDayTimestamp)
        .where('collectionDate', '<=', endOfDayTimestamp)
        .get();

      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        if (payment) {
          const amount = payment.amountPaid || 0;
          const fine = payment.fine || 0;
          if (typeof amount === 'number' && typeof fine === 'number') {
            collectedToday += amount + fine;
          }
        }
      });

      reportData.push({
        date: dateKey,
        collectedToday: Math.round(collectedToday * 100) / 100,
        expectedToday: Math.round(expectedToday * 100) / 100,
      });

    } catch (error) {
      console.error(`Failed to process report for date: ${dateKey}`, error);
      // Push an entry with 0 values to indicate a processing failure for this day
      reportData.push({
        date: dateKey,
        collectedToday: 0,
        expectedToday: 0,
      });
    }
  }
  
  // Return in chronological order
  return reportData.reverse();
}
