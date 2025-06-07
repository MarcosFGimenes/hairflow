"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserPlus, Save, UploadCloud } from 'lucide-react';
import Image from 'next/image';

export default function NewProfessionalPage() {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState(""); // Optional
  const [phone, setPhone] = useState(""); // Optional
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Professional's name is required.");
      return;
    }
    const professionalData = {
      name,
      specialty,
      email,
      phone,
      imageUrl: imageFile ? `path/to/uploaded/${imageFile.name}` : null, // Placeholder for actual upload path
    };
    console.log("New professional data:", professionalData);
    alert("New professional added successfully (This is a demo).");
    // TODO: Implement actual save logic (including image upload) and redirect
    // router.push('/admin/professionals');
  };

  return (
    <>
      <PageHeader 
        title="Add New Professional"
        description="Enter the details for the new staff member."
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Professional Information
          </CardTitle>
          <CardDescription>All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2 text-center">
              <Label htmlFor="profile-image" className="block text-sm font-medium text-muted-foreground">Profile Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Profile preview" width={128} height={128} className="mx-auto h-32 w-32 rounded-full object-cover shadow-md" />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="flex text-sm text-muted-foreground justify-center">
                    <label
                      htmlFor="profile-image-upload"
                      className="relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      <span>{imageUrl ? 'Change image' : 'Upload an image'}</span>
                      <input id="profile-image-upload" name="profile-image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="prof-name">Full Name *</Label>
              <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
            </div>

            <div>
              <Label htmlFor="prof-specialty">Specialty / Role</Label>
              <Input id="prof-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g., Senior Stylist, Color Expert" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prof-email">Email Address (Optional)</Label>
                <Input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" />
              </div>
              <div>
                <Label htmlFor="prof-phone">Phone Number (Optional)</Label>
                <Input id="prof-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
            
            {/* Could add fields for bio, services offered by this professional, etc. */}
            {/* <div>
              <Label htmlFor="prof-bio">Short Bio (Optional)</Label>
              <Textarea id="prof-bio" placeholder="A few words about the professional..." rows={3} />
            </div> */}
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/admin/professionals" passHref legacyBehavior>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Save Professional
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

