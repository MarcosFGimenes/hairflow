import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Clock, Users, DollarSign, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

// Mock data
const stats = {
  upcomingAppointments: 5,
  availableSlotsToday: 12,
  totalProfessionals: 3,
  monthlyRevenue: 1250.75, // Example
};

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of your salon's activity."
        actions={
          <Link href="/admin/appointments/new" passHref legacyBehavior>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> New Appointment</Button>
          </Link>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots Today</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{stats.availableSlotsToday}</div>
            <p className="text-xs text-muted-foreground">Across all professionals</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Professionals</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{stats.totalProfessionals}</div>
            <p className="text-xs text-muted-foreground">Active staff members</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (Est.)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month projection</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/slots" passHref legacyBehavior>
              <Button variant="outline" className="w-full justify-start"><Clock className="mr-2 h-4 w-4" /> Manage Availability</Button>
            </Link>
            <Link href="/admin/professionals" passHref legacyBehavior>
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Add/Edit Professionals</Button>
            </Link>
            <Link href="/admin/settings" passHref legacyBehavior>
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Update Salon Details</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>Latest bookings and updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">New booking: John S. for Haircut - Tomorrow at 2 PM.</li>
              <li className="text-sm text-muted-foreground">Availability updated for Jane D.</li>
              <li className="text-sm text-muted-foreground">Booking cancelled: Alex P. - Today 10 AM.</li>
            </ul>
            <Button variant="link" className="mt-2 px-0">View all activity</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
