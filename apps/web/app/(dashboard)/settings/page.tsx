'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState('Acme Inc');
  const [orgSlug, setOrgSlug] = useState('acme-inc');
  const [orgDescription, setOrgDescription] = useState('Building the future of project management');

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Your organization settings have been updated.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-muted-foreground">Manage your organization&apos;s settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization details</CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">app.tribemem.com/</span>
              <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} className="max-w-[200px]" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">Description</Label>
            <Textarea id="org-desc" value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} rows={3} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Save changes</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crawler settings</CardTitle>
          <CardDescription>Configure how the knowledge crawler operates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-crawl enabled</p>
              <p className="text-xs text-muted-foreground">Automatically crawl connected sources on a schedule</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Conflict detection</p>
              <p className="text-xs text-muted-foreground">Alert when contradicting knowledge is found</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Staleness alerts</p>
              <p className="text-xs text-muted-foreground">Notify when knowledge items drop below confidence threshold</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="confidence-threshold">Confidence threshold (%)</Label>
            <Input id="confidence-threshold" type="number" defaultValue="60" min="0" max="100" className="max-w-[120px]" />
            <p className="text-xs text-muted-foreground">Items below this threshold will be flagged as stale</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Save changes</Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible actions for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
            <div>
              <p className="text-sm font-medium">Delete organization</p>
              <p className="text-xs text-muted-foreground">Permanently delete this organization and all its data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
