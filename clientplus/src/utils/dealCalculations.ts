// src/utils/dealCalculations.ts
// Deal calculation utilities for consultant deal management

interface PublicHoliday {
  id: number;
  name: string;
  date: Date;
  year: number;
  month: number;
  day: number;
}

interface DealCalculationOptions {
  startDate: Date;
  endDate: Date;
  isPartTime?: boolean;
  defaultPartTimeDays?: number;
  publicHolidays?: PublicHoliday[];
}

interface MonthlyDealDays {
  year: number;
  month: number;
  monthName: string;
  totalDays: number;
  weekends: number;
  holidays: number;
  dealDays: number;
  holidayDetails: PublicHoliday[];
}

interface DealCalculationResult {
  monthlyBreakdown: MonthlyDealDays[];
  totalDealDays: number;
  totalWorkingDays: number;
  totalHolidays: number;
}

/**
 * Calculate working days in a month (excluding Fridays and Saturdays)
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Skip Friday (5) and Saturday (6)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
}

/**
 * Check if a date falls on Friday or Saturday
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
}

/**
 * Get all months between two dates
 */
export function getMonthsBetweenDates(startDate: Date, endDate: Date): Array<{year: number, month: number}> {
  const months: Array<{year: number, month: number}> = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || '';
}

/**
 * Filter holidays for a specific month that are not on weekends
 */
export function getHolidaysInMonth(
  year: number, 
  month: number, 
  holidays: PublicHoliday[]
): PublicHoliday[] {
  return holidays.filter(holiday => {
    return holiday.year === year && 
           holiday.month === month && 
           !isWeekend(holiday.date);
  });
}

/**
 * Calculate deal days for a specific month
 */
export function calculateMonthDealDays(
  year: number,
  month: number,
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[] = []
): MonthlyDealDays {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  // Adjust for period boundaries
  const effectiveStart = startDate > monthStart ? startDate : monthStart;
  const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
  
  // Calculate working days in the effective period
  let workingDays = 0;
  let weekends = 0;
  
  for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      weekends++;
    } else {
      workingDays++;
    }
  }
  
  // Get holidays in this month that are not weekends
  const monthHolidays = getHolidaysInMonth(year, month, holidays);
  
  // Filter holidays that fall within the effective period
  const effectiveHolidays = monthHolidays.filter(holiday => {
    return holiday.date >= effectiveStart && holiday.date <= effectiveEnd;
  });
  
  const dealDays = Math.max(0, workingDays - effectiveHolidays.length);
  
  return {
    year,
    month,
    monthName: getMonthName(month),
    totalDays: Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    weekends,
    holidays: effectiveHolidays.length,
    dealDays,
    holidayDetails: effectiveHolidays
  };
}

/**
 * Main function to calculate deal days for a consultant
 */
export function calculateDealDays(options: DealCalculationOptions): DealCalculationResult {
  const {
    startDate,
    endDate,
    isPartTime = false,
    defaultPartTimeDays = 10,
    publicHolidays = []
  } = options;

  // For part-time consultants, return fixed days per month
  if (isPartTime) {
    const months = getMonthsBetweenDates(startDate, endDate);
    const monthlyBreakdown: MonthlyDealDays[] = months.map(({ year, month }) => ({
      year,
      month,
      monthName: getMonthName(month),
      totalDays: defaultPartTimeDays,
      weekends: 0,
      holidays: 0,
      dealDays: defaultPartTimeDays,
      holidayDetails: []
    }));

    return {
      monthlyBreakdown,
      totalDealDays: defaultPartTimeDays * months.length,
      totalWorkingDays: defaultPartTimeDays * months.length,
      totalHolidays: 0
    };
  }

  // For full-time consultants, calculate based on working days
  const months = getMonthsBetweenDates(startDate, endDate);
  const monthlyBreakdown: MonthlyDealDays[] = [];
  let totalDealDays = 0;
  let totalWorkingDays = 0;
  let totalHolidays = 0;

  for (const { year, month } of months) {
    const monthData = calculateMonthDealDays(year, month, startDate, endDate, publicHolidays);
    monthlyBreakdown.push(monthData);
    
    totalDealDays += monthData.dealDays;
    totalWorkingDays += monthData.dealDays + monthData.holidays;
    totalHolidays += monthData.holidays;
  }

  return {
    monthlyBreakdown,
    totalDealDays,
    totalWorkingDays,
    totalHolidays
  };
}

/**
 * Example usage and validation function
 */
export function validateDealCalculation(): void {
  // Example: User A, full time, 1 Jan 2025 to 31 Mar 2025
  const startDate = new Date(2025, 0, 1); // Jan 1, 2025
  const endDate = new Date(2025, 2, 31);   // Mar 31, 2025
  
  const publicHolidays: PublicHoliday[] = [
    {
      id: 1,
      name: "New Year's Day",
      date: new Date(2025, 0, 1), // Jan 1, 2025 (Wednesday)
      year: 2025,
      month: 1,
      day: 1
    },
    {
      id: 2,
      name: "Revolution Day",
      date: new Date(2025, 0, 25), // Jan 25, 2025 (Saturday) - weekend, should not affect
      year: 2025,
      month: 1,
      day: 25
    },
    {
      id: 3,
      name: "Sinai Liberation Day",
      date: new Date(2025, 1, 25), // Feb 25, 2025 (Tuesday)
      year: 2025,
      month: 2,
      day: 25
    },
    {
      id: 4,
      name: "Mother's Day",
      date: new Date(2025, 2, 21), // Mar 21, 2025 (Friday) - weekend, should not affect
      year: 2025,
      month: 3,
      day: 21
    }
  ];

  const result = calculateDealDays({
    startDate,
    endDate,
    isPartTime: false,
    publicHolidays
  });

  console.log('Deal Calculation Example:');
  console.log('Period: Jan 1, 2025 - Mar 31, 2025');
  console.log('Public Holidays:', publicHolidays.map(h => `${h.name} (${h.date.toDateString()})`));
  console.log('\nMonthly Breakdown:');
  
  result.monthlyBreakdown.forEach(month => {
    console.log(`${month.monthName} ${month.year}:`);
    console.log(`  Working days: ${month.dealDays + month.holidays}`);
    console.log(`  Holidays: ${month.holidays} (${month.holidayDetails.map(h => h.name).join(', ') || 'None'})`);
    console.log(`  Deal days: ${month.dealDays}`);
  });
  
  console.log(`\nTotal Deal Days: ${result.totalDealDays}`);
}

/**
 * Helper function to format deal calculation results for display
 */
export function formatDealCalculationSummary(result: DealCalculationResult): string {
  const summary = result.monthlyBreakdown.map(month => {
    const holidayText = month.holidayDetails.length > 0 
      ? ` (holidays: ${month.holidayDetails.map(h => h.name).join(', ')})`
      : '';
    
    return `${month.monthName}: ${month.dealDays} days${holidayText}`;
  }).join('\n');
  
  return `${summary}\n\nTotal: ${result.totalDealDays} deal days`;
}